'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Save, Download, Upload, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TranslationData {
  [key: string]: any;
}

export default function AdminLanguagesPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [trTranslations, setTrTranslations] = useState<TranslationData>({});
  const [enTranslations, setEnTranslations] = useState<TranslationData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('tr');

  useEffect(() => {
    // Check if already authenticated in session
    const isAuth = sessionStorage.getItem('admin-authenticated');
    if (isAuth === 'true') {
      setIsAuthenticated(true);
      loadTranslations();
    }
  }, []);

  const handleLogin = () => {
    if (password === 'admin-password') {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin-authenticated', 'true');
      loadTranslations();
      toast.success('Giriş başarılı!');
    } else {
      toast.error('Hatalı şifre!');
    }
  };

  const loadTranslations = async () => {
    try {
      setIsLoading(true);
      
      // Load Turkish translations
      const trResponse = await fetch('/messages/tr.json');
      if (trResponse.ok) {
        const trData = await trResponse.json();
        setTrTranslations(trData);
      }
      
      // Load English translations
      const enResponse = await fetch('/messages/en.json');
      if (enResponse.ok) {
        const enData = await enResponse.json();
        setEnTranslations(enData);
      }
    } catch (error) {
      toast.error('Çeviriler yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const saveTranslations = async () => {
    try {
      setIsLoading(true);
      
      // Save Turkish translations
      const trResponse = await fetch('/api/admin/translations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          locale: 'tr',
          translations: trTranslations
        })
      });
      
      // Save English translations
      const enResponse = await fetch('/api/admin/translations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          locale: 'en',
          translations: enTranslations
        })
      });
      
      if (trResponse.ok && enResponse.ok) {
        toast.success('Çeviriler başarıyla kaydedildi!');
      } else {
        toast.error('Çeviriler kaydedilirken hata oluştu');
      }
    } catch (error) {
      toast.error('Çeviriler kaydedilirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const exportTranslations = () => {
    const data = {
      tr: trTranslations,
      en: enTranslations
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'translations.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Çeviriler dışa aktarıldı!');
  };

  const updateNestedValue = (obj: any, path: string, value: string) => {
    const keys = path.split('.');
    const newObj = { ...obj };
    let current = newObj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    return newObj;
  };

  const getNestedValue = (obj: any, path: string): string => {
    return path.split('.').reduce((current, key) => current?.[key], obj) || '';
  };

  const renderTranslationFields = (translations: TranslationData, setTranslations: (data: TranslationData) => void, prefix = '') => {
    const fields: React.ReactElement[] = [];
    
    const addField = (key: string, value: any, fullPath: string) => {
      if (typeof value === 'string') {
        fields.push(
          <div key={fullPath} className="space-y-2">
            <Label htmlFor={fullPath} className="text-sm font-medium">
              {fullPath}
            </Label>
            <Textarea
              id={fullPath}
              value={value}
              onChange={(e) => {
                const newTranslations = updateNestedValue(translations, fullPath, e.target.value);
                setTranslations(newTranslations);
              }}
              className="min-h-[60px]"
              placeholder={`${fullPath} için çeviri girin...`}
            />
          </div>
        );
      } else if (typeof value === 'object' && value !== null) {
        Object.entries(value).forEach(([subKey, subValue]) => {
          const newPath = fullPath ? `${fullPath}.${subKey}` : subKey;
          addField(subKey, subValue, newPath);
        });
      }
    };
    
    Object.entries(translations).forEach(([key, value]) => {
      const fullPath = prefix ? `${prefix}.${key}` : key;
      addField(key, value, fullPath);
    });
    
    return fields;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Admin Paneli</CardTitle>
            <CardDescription className="text-center">
              Dil yönetimi için şifrenizi girin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="Admin şifresini girin"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button onClick={handleLogin} className="w-full">
              Giriş Yap
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dil Yönetimi</h1>
          <p className="text-gray-600">Türkçe ve İngilizce çevirileri yönetin</p>
        </div>

        <div className="mb-6 flex gap-4">
          <Button onClick={saveTranslations} disabled={isLoading} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {isLoading ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
          <Button onClick={exportTranslations} variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Dışa Aktar
          </Button>
          <Button 
            onClick={() => {
              sessionStorage.removeItem('admin-authenticated');
              router.push('/');
            }} 
            variant="destructive"
          >
            Çıkış Yap
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tr">Türkçe</TabsTrigger>
            <TabsTrigger value="en">İngilizce</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tr" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Türkçe Çeviriler</CardTitle>
                <CardDescription>
                  Türkçe dil dosyasındaki çevirileri düzenleyin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
                {renderTranslationFields(trTranslations, setTrTranslations)}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="en" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>English Translations</CardTitle>
                <CardDescription>
                  Edit translations in the English language file
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
                {renderTranslationFields(enTranslations, setEnTranslations)}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}