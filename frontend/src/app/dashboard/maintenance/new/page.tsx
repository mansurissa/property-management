'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { maintenanceApi, CreateMaintenanceData } from '@/lib/api/maintenance';
import { propertiesApi, Property } from '@/lib/api/properties';
import { Unit } from '@/lib/api/properties';
import { tenantsApi, Tenant } from '@/lib/api/tenants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function NewMaintenancePage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [availableUnits, setAvailableUnits] = useState<Unit[]>([]);
  const [formData, setFormData] = useState<CreateMaintenanceData>({
    unitId: '',
    tenantId: undefined,
    category: 'other',
    description: '',
    priority: 'medium',
  });

  const categories = [
    { value: 'plumbing', label: t('owner.plumbing') },
    { value: 'electrical', label: t('owner.electrical') },
    { value: 'structural', label: t('owner.structural') },
    { value: 'appliance', label: t('owner.appliance') },
    { value: 'other', label: t('owner.other') },
  ];

  const priorities = [
    { value: 'low', label: t('tenant.low') },
    { value: 'medium', label: t('tenant.medium') },
    { value: 'high', label: t('tenant.high') },
    { value: 'urgent', label: t('tenant.urgent') },
  ];

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    if (selectedProperty) {
      const property = properties.find(p => p.id === selectedProperty);
      setAvailableUnits(property?.units || []);
      setFormData(prev => ({ ...prev, unitId: '', tenantId: undefined }));
    }
  }, [selectedProperty, properties]);

  useEffect(() => {
    if (formData.unitId) {
      const unit = availableUnits.find(u => u.id === formData.unitId);
      if (unit?.tenant) {
        setFormData(prev => ({ ...prev, tenantId: unit.tenant?.id }));
      }
    }
  }, [formData.unitId, availableUnits]);

  const loadProperties = async () => {
    try {
      const data = await propertiesApi.getAll();
      setProperties(data);
    } catch (err) {
      toast.error(t('owner.failedToLoadProperties'));
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.unitId || !formData.category || !formData.description) {
      toast.error(t('owner.fillRequired'));
      return;
    }

    setLoading(true);
    try {
      await maintenanceApi.create(formData);
      toast.success(t('owner.ticketCreatedSuccess'));
      router.push('/dashboard/maintenance');
    } catch (err) {
      toast.error(t('owner.failedToCreateTicket'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/maintenance">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{t('owner.newMaintenanceTicket')}</h1>
          <p className="text-muted-foreground">
            {t('owner.reportMaintenanceIssue')}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>{t('owner.location')}</CardTitle>
            <CardDescription>
              {t('owner.selectPropertyAndUnit')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('owner.propertyRequired')}</Label>
                <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('owner.selectProperty')} />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('owner.unitRequired')}</Label>
                <Select
                  value={formData.unitId}
                  onValueChange={(value) => setFormData({ ...formData, unitId: value })}
                  disabled={!selectedProperty}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedProperty ? t('owner.selectUnit') : t('owner.selectPropertyFirst')} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUnits.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {t('owner.unit')} {unit.unitNumber}
                        {unit.tenant && ` - ${unit.tenant.firstName} ${unit.tenant.lastName}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('owner.issueDetails')}</CardTitle>
            <CardDescription>
              {t('owner.describeMaintenanceIssue')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('owner.categoryRequired')}</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: any) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('owner.selectCategory')} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('owner.priorityLabel')}</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('owner.selectPriority')} />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((pri) => (
                      <SelectItem key={pri.value} value={pri.value}>
                        {pri.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('owner.descriptionRequired')}</Label>
              <Textarea
                placeholder={t('owner.descriptionDetailPlaceholder')}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={5}
                required
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? t('owner.creating') : t('owner.createTicketBtn')}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/maintenance">{t('common.cancel')}</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
