'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { registerPartner } from '../actions';

export function RegistrationForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  async function handleSubmit(formData: FormData) {
    setStatus('loading');
    setErrorMessage('');
    
    const result = await registerPartner(formData);

    if (result?.error) {
      setStatus('error');
      setErrorMessage(result.error);
    } else {
      setStatus('success');
    }
  }

  if (status === 'success') {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center max-w-md mx-auto"
      >
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-2xl font-bold text-emerald-900 mb-2">Dziękujemy!</h3>
        <p className="text-emerald-700">
          Twoje zgłoszenie zostało przyjęte. Nasz opiekun B2B skontaktuje się z Tobą w ciągu 24h, aby aktywować konto partnerskie.
        </p>
      </motion.div>
    );
  }

  return (
    <section id="register" className="py-24 bg-gray-50">
      <div className="container mx-auto px-4 md:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Dołącz do programu partnerskiego</h2>
            <p className="text-gray-600">Wypełnij formularz, aby otrzymać dostęp do panelu i zacząć zarabiać.</p>
          </div>

          <form action={handleSubmit} className="bg-white rounded-3xl shadow-xl p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-gray-700">Imię i Nazwisko</label>
                <input 
                  type="text" 
                  id="name" 
                  name="name" 
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                  placeholder="Jan Kowalski"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium text-gray-700">Telefon</label>
                <input 
                  type="tel" 
                  id="phone" 
                  name="phone" 
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                  placeholder="+48 000 000 000"
                />
              </div>
            </div>

            <div className="space-y-2 mb-6">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">Email firmowy</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                placeholder="biuro@twoja-firma.pl"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-2">
                    <label htmlFor="companyName" className="text-sm font-medium text-gray-700">Nazwa Firmy</label>
                    <input 
                    type="text" 
                    id="companyName" 
                    name="companyName" 
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                    placeholder="Nazwa Twojej Firmy"
                    />
                </div>
                <div className="space-y-2">
                    <label htmlFor="nip" className="text-sm font-medium text-gray-700">NIP</label>
                    <input 
                    type="text" 
                    id="nip" 
                    name="nip" 
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                    placeholder="0000000000"
                    />
                </div>
            </div>

            {status === 'error' && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3">
                <AlertCircle className="h-5 w-5" />
                <p>{errorMessage}</p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={status === 'loading'}
              className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Przetwarzanie...
                </>
              ) : (
                'Zarejestruj firmę'
              )}
            </button>
            
            <p className="mt-4 text-xs text-center text-gray-500">
              Klikając przycisk, akceptujesz regulamin programu partnerskiego.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
