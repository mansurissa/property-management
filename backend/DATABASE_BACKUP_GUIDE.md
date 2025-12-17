# Database Backup & Recovery Guide

## Overview
This guide provides comprehensive instructions for backing up and restoring the Renta database.

---

## 🔄 Automated Backups

### Setup Automated Daily Backups

#### 1. Make Scripts Executable
```bash
chmod +x scripts/backup-database.sh
chmod +x scripts/restore-database.sh
```

#### 2. Test Manual Backup
```bash
./scripts/backup-database.sh
```

Expected output:
```
Backing up database: renta-db
✓ Backup completed successfully
Backup compressed: backups/renta_backup_20251217_142530.sql.gz (Size: 2.4M)
```

#### 3. Set Up Cron Job (Linux/Mac)

Edit crontab:
```bash
crontab -e
```

Add daily backup at 2 AM:
```
0 2 * * * cd /path/to/property-management/backend && ./scripts/backup-database.sh >> /var/log/renta-backup.log 2>&1
```

Verify cron job:
```bash
crontab -l
```

#### 4. Alternative: Systemd Timer (Linux)

Create timer file: `/etc/systemd/system/renta-backup.timer`
```ini
[Unit]
Description=Daily Renta Database Backup
Requires=renta-backup.service

[Timer]
OnCalendar=daily
OnCalendar=02:00
Persistent=true

[Install]
WantedBy=timers.target
```

Create service file: `/etc/systemd/system/renta-backup.service`
```ini
[Unit]
Description=Renta Database Backup Service

[Service]
Type=oneshot
User=your-user
WorkingDirectory=/path/to/property-management/backend
ExecStart=/path/to/property-management/backend/scripts/backup-database.sh
```

Enable and start:
```bash
sudo systemctl enable renta-backup.timer
sudo systemctl start renta-backup.timer
sudo systemctl status renta-backup.timer
```

---

## 💾 Manual Backups

### Quick Backup
```bash
./scripts/backup-database.sh
```

### Backup with Custom Name
```bash
pg_dump -h localhost -U postgres -d renta-db -F c -f backups/manual_backup_$(date +%Y%m%d).sql
gzip backups/manual_backup_*.sql
```

### Backup Specific Tables Only
```bash
pg_dump -h localhost -U postgres -d renta-db -t Tenants -t Payments -F c -f backups/tenants_payments.sql
```

### Backup Schema Only (No Data)
```bash
pg_dump -h localhost -U postgres -d renta-db --schema-only -f backups/schema_only.sql
```

---

## 🔙 Restoring from Backup

### Restore Latest Backup

#### 1. List Available Backups
```bash
ls -lht backups/renta_backup_*.sql.gz | head -5
```

#### 2. Restore
```bash
./scripts/restore-database.sh backups/renta_backup_20251217_020000.sql.gz
```

**⚠️ WARNING:** This will DROP and recreate the database!

#### 3. Confirm
```
==================== WARNING ====================
This will DROP the database: renta-db
All current data will be LOST!
=================================================

Are you sure you want to continue? (type 'yes' to proceed):
```

Type `yes` to proceed.

### Restore to Different Database

```bash
export DB_NAME=renta-db-restored
./scripts/restore-database.sh backups/renta_backup_20251217_020000.sql.gz
```

---

## 🔍 Backup Verification

### Check Backup Integrity
```bash
# Decompress and verify
gunzip -t backups/renta_backup_20251217_020000.sql.gz

# List contents
pg_restore -l backups/renta_backup_20251217_020000.sql.gz | head -20
```

### Test Restore to Temporary Database
```bash
# Create temp database
psql -U postgres -c "CREATE DATABASE renta_test;"

# Restore to temp
pg_restore -h localhost -U postgres -d renta_test backups/renta_backup_20251217_020000.sql.gz

# Verify data
psql -U postgres -d renta_test -c "SELECT COUNT(*) FROM \"Tenants\";"
psql -U postgres -d renta_test -c "SELECT COUNT(*) FROM \"Properties\";"

# Drop temp database
psql -U postgres -c "DROP DATABASE renta_test;"
```

---

## 📊 Backup Monitoring

### Check Backup Status
```bash
tail -f backups/backup.log
```

### View Backup History
```bash
cat backups/backup.log | grep "Backup completed"
```

### Backup Size Over Time
```bash
du -sh backups/renta_backup_*.sql.gz | tail -10
```

### Alert on Backup Failure

Add to `backup-database.sh`:
```bash
if [ $? -ne 0 ]; then
    # Send email alert
    echo "Backup failed at $(date)" | mail -s "Renta Backup Failed" admin@yourdomain.com

    # Or send Slack notification
    curl -X POST -H 'Content-type: application/json' \
        --data '{"text":"🚨 Renta backup failed!"}' \
        YOUR_SLACK_WEBHOOK_URL
fi
```

---

## ☁️ Cloud Backup Integration

### Upload to AWS S3

Add to `backup-database.sh`:
```bash
# After successful backup
if command -v aws &> /dev/null; then
    aws s3 cp "${BACKUP_FILE}.gz" \
        "s3://your-bucket/renta-backups/$(basename ${BACKUP_FILE}.gz)" \
        --storage-class GLACIER

    log "Backup uploaded to S3"
fi
```

### Upload to Google Cloud Storage
```bash
gsutil cp "${BACKUP_FILE}.gz" \
    "gs://your-bucket/renta-backups/$(basename ${BACKUP_FILE}.gz)"
```

### Upload to Azure Blob Storage
```bash
az storage blob upload \
    --account-name youraccount \
    --container-name renta-backups \
    --file "${BACKUP_FILE}.gz" \
    --name "$(basename ${BACKUP_FILE}.gz)"
```

---

## 🔐 Encrypted Backups

### Encrypt Backup with GPG
```bash
# Create encrypted backup
./scripts/backup-database.sh
gpg --symmetric --cipher-algo AES256 backups/renta_backup_20251217_020000.sql.gz

# Restore from encrypted backup
gpg --decrypt backups/renta_backup_20251217_020000.sql.gz.gpg | \
    gunzip | \
    pg_restore -h localhost -U postgres -d renta-db
```

### Encrypt with OpenSSL
```bash
# Encrypt
openssl enc -aes-256-cbc -salt \
    -in backups/renta_backup_20251217_020000.sql.gz \
    -out backups/renta_backup_20251217_020000.sql.gz.enc

# Decrypt
openssl enc -d -aes-256-cbc \
    -in backups/renta_backup_20251217_020000.sql.gz.enc \
    -out backups/renta_backup_20251217_020000.sql.gz
```

---

## 📋 Backup Retention Policy

### Current Settings
- **Frequency:** Daily at 2:00 AM
- **Retention:** 30 days
- **Compression:** gzip level 9
- **Format:** PostgreSQL custom format

### Recommended Production Settings

```bash
# In backup-database.sh, modify:
RETENTION_DAYS=90        # Keep 90 days of daily backups
MONTHLY_RETENTION=365    # Keep 1 year of monthly backups
```

### 3-2-1 Backup Strategy

Follow the 3-2-1 rule:
- **3** copies of your data
- **2** different storage types
- **1** copy offsite

Example implementation:
1. **Primary:** Live database
2. **Secondary:** Local backup directory
3. **Offsite:** Cloud storage (S3/GCS/Azure)

---

## 🚨 Disaster Recovery Plan

### Recovery Time Objective (RTO): 2 hours

#### Step 1: Assess Situation
```bash
# Check database status
psql -U postgres -d renta-db -c "SELECT version();"

# Check table counts
psql -U postgres -d renta-db -c "
    SELECT
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"
```

#### Step 2: Stop Application
```bash
# Stop backend server
pm2 stop renta-backend

# Or with systemd
sudo systemctl stop renta-backend
```

#### Step 3: Restore Latest Backup
```bash
./scripts/restore-database.sh backups/renta_backup_LATEST.sql.gz
```

#### Step 4: Verify Data Integrity
```bash
psql -U postgres -d renta-db <<EOF
SELECT COUNT(*) as tenant_count FROM "Tenants";
SELECT COUNT(*) as property_count FROM "Properties";
SELECT COUNT(*) as payment_count FROM "Payments";
SELECT MAX("createdAt") as last_record FROM "Tenants";
EOF
```

#### Step 5: Restart Application
```bash
pm2 start renta-backend
```

#### Step 6: Test Critical Functions
- Login as admin
- View properties
- View tenants
- Check dashboard stats

---

## 🧪 Testing Procedures

### Monthly Restore Test

Schedule monthly restore test:
1. Create test database
2. Restore latest backup
3. Verify data integrity
4. Drop test database
5. Document results

### Automated Test Script

Create `scripts/test-backup.sh`:
```bash
#!/bin/bash
TEST_DB="renta_test_$(date +%s)"

# Create test database
psql -U postgres -c "CREATE DATABASE \"$TEST_DB\";"

# Restore latest backup
LATEST_BACKUP=$(ls -t backups/renta_backup_*.sql.gz | head -1)
gunzip -c "$LATEST_BACKUP" | pg_restore -U postgres -d "$TEST_DB"

# Run integrity checks
psql -U postgres -d "$TEST_DB" -c "
    SELECT
        'Tenants' as table, COUNT(*) as count FROM \"Tenants\"
    UNION ALL
    SELECT 'Properties', COUNT(*) FROM \"Properties\"
    UNION ALL
    SELECT 'Payments', COUNT(*) FROM \"Payments\";
"

# Cleanup
psql -U postgres -c "DROP DATABASE \"$TEST_DB\";"

echo "✓ Backup test completed successfully"
```

---

## 📞 Support

### Common Issues

#### Issue: "pg_dump: command not found"
**Solution:** Install PostgreSQL client tools
```bash
# Ubuntu/Debian
sudo apt-get install postgresql-client

# Mac
brew install postgresql

# RHEL/CentOS
sudo yum install postgresql
```

#### Issue: "Permission denied"
**Solution:** Make scripts executable
```bash
chmod +x scripts/*.sh
```

#### Issue: "Disk space full"
**Solution:**
1. Check disk space: `df -h`
2. Clean old backups: `find backups -mtime +30 -delete`
3. Archive to cloud storage

#### Issue: "Connection refused"
**Solution:** Check database is running
```bash
sudo systemctl status postgresql
psql -U postgres -h localhost -c "SELECT 1;"
```

---

## 📈 Best Practices

1. ✅ **Test backups regularly** - Monthly restore tests
2. ✅ **Monitor backup size** - Alert if size changes dramatically
3. ✅ **Verify backup integrity** - Check file corruption
4. ✅ **Store offsite** - Cloud storage for disaster recovery
5. ✅ **Encrypt sensitive data** - Use GPG or OpenSSL
6. ✅ **Document procedures** - Keep this guide updated
7. ✅ **Automate everything** - Reduce human error
8. ✅ **Monitor disk space** - Ensure enough space for backups
9. ✅ **Alert on failures** - Email/Slack notifications
10. ✅ **Version control** - Track backup script changes

---

## 📅 Maintenance Schedule

| Task | Frequency | Responsible |
|------|-----------|-------------|
| Automated backup | Daily 2 AM | Cron |
| Verify latest backup | Daily | DevOps |
| Test restore procedure | Monthly | DevOps |
| Review backup logs | Weekly | DevOps |
| Clean old backups | Automatic | Script |
| Update retention policy | Quarterly | Tech Lead |
| Disaster recovery drill | Quarterly | Team |
| Archive to cloud | Daily | Script |

---

## 🎯 Success Metrics

- **Backup Success Rate:** > 99%
- **Average Backup Time:** < 5 minutes
- **Average Restore Time:** < 10 minutes
- **Backup Size Growth:** Track monthly
- **Recovery Time Objective:** < 2 hours
- **Recovery Point Objective:** < 24 hours

---

Last Updated: 2025-12-17
Version: 1.0
