'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { propertiesApi } from '@/lib/api/properties';
import { propertySchema, PropertyFormData } from '@/lib/validations/property.schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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

const rwandaCities = [
  'Kigali',
  'Butare',
  'Gitarama',
  'Ruhengeri',
  'Gisenyi',
  'Byumba',
  'Cyangugu',
  'Nyanza',
  'Kibungo',
  'Rwamagana',
];

export default function NewPropertyPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      name: '',
      type: 'apartment',
      address: '',
      city: 'Kigali',
      description: '',
    },
  });

  const propertyTypes = [
    { value: 'apartment', label: t('owner.apartment') },
    { value: 'house', label: t('owner.house') },
    { value: 'commercial', label: t('owner.commercial') },
    { value: 'land', label: 'Land' },
    { value: 'other', label: t('owner.other') },
  ];

  const onSubmit = async (data: PropertyFormData) => {
    setLoading(true);
    try {
      await propertiesApi.create(data);
      toast.success(t('owner.propertyCreatedSuccess'));
      router.push('/dashboard/properties');
    } catch (err) {
      toast.error(t('owner.failedToCreateProperty'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/properties">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{t('owner.addProperty')}</h1>
          <p className="text-muted-foreground">
            {t('owner.createNewProperty')}
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>{t('owner.propertyDetails')}</CardTitle>
          <CardDescription>
            {t('owner.enterPropertyDetails')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('owner.propertyNameLabel')}</Label>
              <Input
                id="name"
                placeholder={t('owner.propertyNamePlaceholder')}
                {...register('name')}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">{t('owner.propertyTypeLabel')}</Label>
              <Select
                value={watch('type')}
                onValueChange={(value) => setValue('type', value as PropertyFormData['type'])}
              >
                <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                  <SelectValue placeholder={t('owner.selectType')} />
                </SelectTrigger>
                <SelectContent>
                  {propertyTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-red-500">{errors.type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">{t('owner.addressLabel')}</Label>
              <Input
                id="address"
                placeholder={t('owner.addressPlaceholder')}
                {...register('address')}
                className={errors.address ? 'border-red-500' : ''}
              />
              {errors.address && (
                <p className="text-sm text-red-500">{errors.address.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">{t('owner.cityLabel')}</Label>
              <Select
                value={watch('city')}
                onValueChange={(value) => setValue('city', value)}
              >
                <SelectTrigger className={errors.city ? 'border-red-500' : ''}>
                  <SelectValue placeholder={t('owner.selectCity')} />
                </SelectTrigger>
                <SelectContent>
                  {rwandaCities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.city && (
                <p className="text-sm text-red-500">{errors.city.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('owner.descriptionLabel')}</Label>
              <Textarea
                id="description"
                placeholder={t('owner.descriptionPlaceholder')}
                {...register('description')}
                rows={4}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? t('owner.creating') : t('owner.createProperty')}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/properties">{t('common.cancel')}</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
