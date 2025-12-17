'use client';

import { useState } from 'react';
import { X, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { demoRequestsApi } from '@/lib/api/demo-requests';

interface DemoRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DemoRequestModal({
  isOpen,
  onClose
}: DemoRequestModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    companyName: '',
    numberOfProperties: '',
    message: ''
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, numberOfProperties: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await demoRequestsApi.submit(formData);
      setIsSuccess(true);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Failed to submit request. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      companyName: '',
      numberOfProperties: '',
      message: ''
    });
    setIsSuccess(false);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center'>
      {/* Backdrop */}
      <div
        className='absolute inset-0 bg-black/50 backdrop-blur-sm'
        onClick={handleClose}
      />

      {/* Modal */}
      <div className='relative w-full max-w-lg mx-4 bg-background rounded-2xl shadow-2xl overflow-hidden'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b'>
          <div>
            <h2 className='text-xl font-bold'>Request a Demo</h2>
            <p className='text-sm text-muted-foreground'>
              See how Renta can help manage your properties
            </p>
          </div>
          <Button variant='ghost' size='icon' onClick={handleClose}>
            <X className='h-5 w-5' />
          </Button>
        </div>

        {/* Content */}
        <div className='p-6'>
          {isSuccess ? (
            <div className='text-center py-8'>
              <div className='flex justify-center mb-4'>
                <div className='w-16 h-16 rounded-full bg-green-100 flex items-center justify-center'>
                  <CheckCircle2 className='h-8 w-8 text-green-600' />
                </div>
              </div>
              <h3 className='text-lg font-semibold mb-2'>Thank You!</h3>
              <p className='text-muted-foreground mb-6'>
                Your demo request has been submitted successfully. Our team will
                contact you within 24-48 hours.
              </p>
              <Button onClick={handleClose}>Close</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className='space-y-4'>
              {error && (
                <div className='p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg'>
                  {error}
                </div>
              )}

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='fullName'>Full Name *</Label>
                  <Input
                    id='fullName'
                    name='fullName'
                    placeholder='John Doe'
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='email'>Email *</Label>
                  <Input
                    id='email'
                    name='email'
                    type='email'
                    placeholder='john@example.com'
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='phone'>Phone Number *</Label>
                  <Input
                    id='phone'
                    name='phone'
                    type='tel'
                    placeholder='+250 788 123 456'
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='companyName'>Company Name</Label>
                  <Input
                    id='companyName'
                    name='companyName'
                    placeholder='Your Company'
                    value={formData.companyName}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='numberOfProperties'>Number of Properties</Label>
                <Select
                  value={formData.numberOfProperties}
                  onValueChange={handleSelectChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select range' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='1-5'>1-5 properties</SelectItem>
                    <SelectItem value='6-20'>6-20 properties</SelectItem>
                    <SelectItem value='21-50'>21-50 properties</SelectItem>
                    <SelectItem value='51-100'>51-100 properties</SelectItem>
                    <SelectItem value='100+'>100+ properties</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='message'>Message (Optional)</Label>
                <Textarea
                  id='message'
                  name='message'
                  placeholder='Tell us about your property management needs...'
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>

              <div className='flex gap-3 pt-2'>
                <Button
                  type='button'
                  variant='outline'
                  className='flex-1'
                  onClick={handleClose}
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  className='flex-1'
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Submitting...
                    </>
                  ) : (
                    'Request Demo'
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
