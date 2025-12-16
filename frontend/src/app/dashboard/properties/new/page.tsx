'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { propertiesApi, CreatePropertyData } from '@/lib/api/properties';
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
  const [formData, setFormData] = useState<CreatePropertyData>({
    name: '',
    type: 'apartment',
    address: '',
    city: 'Kigali',
    description: '',
  });

  const propertyTypes = [
    { value: 'apartment', label: t('owner.apartment') },
    { value: 'house', label: t('owner.house') },
    { value: 'commercial', label: t('owner.commercial') },
    { value: 'other', label: t('owner.other') },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.address) {
      toast.error(t('owner.fillRequired'));
      return;
    }

    setLoading(true);
    try {
      await propertiesApi.create(formData);
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('owner.propertyNameLabel')}</Label>
              <Input
                id="name"
                placeholder={t('owner.propertyNamePlaceholder')}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">{t('owner.propertyTypeLabel')}</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">{t('owner.addressLabel')}</Label>
              <Input
                id="address"
                placeholder={t('owner.addressPlaceholder')}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">{t('owner.cityLabel')}</Label>
              <Select
                value={formData.city}
                onValueChange={(value) => setFormData({ ...formData, city: value })}
              >
                <SelectTrigger>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('owner.descriptionLabel')}</Label>
              <Textarea
                id="description"
                placeholder={t('owner.descriptionPlaceholder')}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
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
