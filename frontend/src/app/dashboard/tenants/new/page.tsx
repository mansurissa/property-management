'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { tenantsApi } from '@/lib/api/tenants';
import { propertiesApi, Property } from '@/lib/api/properties';
import { Unit } from '@/lib/api/properties';
import { tenantSchema, TenantFormData } from '@/lib/validations/tenant.schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { documentsApi } from '@/lib/api/documents';

export default function NewTenantPage() {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [availableUnits, setAvailableUnits] = useState<Unit[]>([]);
  const [leaseAgreementFile, setLeaseAgreementFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<TenantFormData>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      nationalId: '',
      emergencyContact: '',
      emergencyPhone: '',
      unitId: '',
      leaseStartDate: '',
      leaseEndDate: '',
    },
  });

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    if (selectedProperty) {
      const property = properties.find(p => p.id === selectedProperty);
      const vacantUnits = property?.units?.filter(u => u.status === 'vacant') || [];
      setAvailableUnits(vacantUnits);
      setValue('unitId', '');
    } else {
      setAvailableUnits([]);
    }
  }, [selectedProperty, properties, setValue]);

  const loadProperties = async () => {
    try {
      const data = await propertiesApi.getAll();
      setProperties(data);
    } catch (err) {
      toast.error(t('owner.failedToLoadProperties'));
      console.error(err);
    }
  };

  const onSubmit = async (data: TenantFormData) => {
    setLoading(true);
    try {
      const newTenant = await tenantsApi.create(data);

      // If there's a lease agreement file, upload it
      if (leaseAgreementFile && newTenant.id) {
        try {
          await documentsApi.uploadTenantDocument(
            newTenant.id,
            leaseAgreementFile,
            'lease_agreement'
          );
        } catch (docErr) {
          console.error('Failed to upload lease agreement:', docErr);
          toast.error('Tenant created but failed to upload lease agreement');
        }
      }

      toast.success(t('owner.tenantCreatedSuccess'));
      router.push('/dashboard/tenants');
    } catch (err) {
      toast.error(t('owner.failedToCreateTenant'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(`${locale}-RW`, {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/tenants">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{t('owner.addTenant')}</h1>
          <p className="text-muted-foreground">
            {t('owner.createNewTenant')}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('owner.personalInformation')}</CardTitle>
            <CardDescription>
              {t('owner.enterTenantDetails')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">{t('owner.firstNameLabel')}</Label>
                <Input
                  id="firstName"
                  placeholder={t('owner.firstNamePlaceholder')}
                  {...register('firstName')}
                  className={errors.firstName ? 'border-red-500' : ''}
                />
                {errors.firstName && (
                  <p className="text-sm text-red-500">{errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{t('owner.lastNameLabel')}</Label>
                <Input
                  id="lastName"
                  placeholder={t('owner.lastNamePlaceholder')}
                  {...register('lastName')}
                  className={errors.lastName ? 'border-red-500' : ''}
                />
                {errors.lastName && (
                  <p className="text-sm text-red-500">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">{t('owner.phoneLabel')}</Label>
                <Input
                  id="phone"
                  placeholder={t('owner.phonePlaceholder')}
                  {...register('phone')}
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && (
                  <p className="text-sm text-red-500">{errors.phone.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('owner.emailLabel')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('owner.emailPlaceholder')}
                  {...register('email')}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nationalId">{t('owner.nationalIdLabel')}</Label>
              <Input
                id="nationalId"
                placeholder={t('owner.nationalIdPlaceholder')}
                {...register('nationalId')}
                className={errors.nationalId ? 'border-red-500' : ''}
              />
              {errors.nationalId && (
                <p className="text-sm text-red-500">{errors.nationalId.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('owner.emergencyContact')}</CardTitle>
            <CardDescription>
              {t('owner.emergencyContactInfo')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyContact">{t('owner.contactName')}</Label>
                <Input
                  id="emergencyContact"
                  placeholder={t('owner.contactNamePlaceholder')}
                  {...register('emergencyContact')}
                  className={errors.emergencyContact ? 'border-red-500' : ''}
                />
                {errors.emergencyContact && (
                  <p className="text-sm text-red-500">{errors.emergencyContact.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyPhone">{t('owner.contactPhone')}</Label>
                <Input
                  id="emergencyPhone"
                  placeholder={t('owner.phonePlaceholder')}
                  {...register('emergencyPhone')}
                  className={errors.emergencyPhone ? 'border-red-500' : ''}
                />
                {errors.emergencyPhone && (
                  <p className="text-sm text-red-500">{errors.emergencyPhone.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('owner.unitAssignment')}</CardTitle>
            <CardDescription>
              {t('owner.assignTenantToUnit')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="property">{t('owner.propertyLabel')}</Label>
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
                <Label htmlFor="unit">{t('owner.unitLabel')}</Label>
                <Select
                  value={watch('unitId') || ''}
                  onValueChange={(value) => setValue('unitId', value)}
                  disabled={!selectedProperty || availableUnits.length === 0}
                >
                  <SelectTrigger className={errors.unitId ? 'border-red-500' : ''}>
                    <SelectValue placeholder={
                      !selectedProperty ? t('owner.selectPropertyFirst') :
                      availableUnits.length === 0 ? t('owner.noVacantUnits') :
                      t('owner.selectUnit')
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUnits.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {t('owner.unit')} {unit.unitNumber} - {formatCurrency(unit.monthlyRent)}/mo
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.unitId && (
                  <p className="text-sm text-red-500">{errors.unitId.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="leaseStartDate">{t('owner.leaseStartDate')}</Label>
                <Input
                  id="leaseStartDate"
                  type="date"
                  {...register('leaseStartDate')}
                  className={errors.leaseStartDate ? 'border-red-500' : ''}
                />
                {errors.leaseStartDate && (
                  <p className="text-sm text-red-500">{errors.leaseStartDate.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="leaseEndDate">{t('owner.leaseEndDate')}</Label>
                <Input
                  id="leaseEndDate"
                  type="date"
                  {...register('leaseEndDate')}
                  className={errors.leaseEndDate ? 'border-red-500' : ''}
                />
                {errors.leaseEndDate && (
                  <p className="text-sm text-red-500">{errors.leaseEndDate.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="leaseAgreement">Lease Agreement (Optional)</Label>
              <p className="text-sm text-muted-foreground">Upload lease agreement PDF, JPEG, or PNG (max 10MB)</p>
              <div className="flex items-center gap-3">
                <Input
                  id="leaseAgreement"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setLeaseAgreementFile(e.target.files?.[0] || null)}
                  className="cursor-pointer"
                />
                {leaseAgreementFile && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setLeaseAgreementFile(null)}
                  >
                    Clear
                  </Button>
                )}
              </div>
              {leaseAgreementFile && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  {leaseAgreementFile.name} ({(leaseAgreementFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? t('owner.creating') : t('owner.createTenant')}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/tenants">{t('common.cancel')}</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
