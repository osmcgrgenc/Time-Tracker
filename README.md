# 🚀 Verimly - Gamified Zaman Takip Uygulaması

**Verimly**, modern ve gamified özelliklere sahip profesyonel bir zaman takip uygulamasıdır. Kullanıcıların çalışma sürelerini takip etmelerini, projelerini yönetmelerini ve motivasyonlarını artırmalarını sağlayan kapsamlı bir platform sunar.

## 📋 İçindekiler

- [Özellikler](#-özellikler)
- [Teknoloji Stack'i](#-teknoloji-stacki)
- [Kurulum ve Çalıştırma](#-kurulum-ve-çalıştırma)
- [Proje Yapısı](#-proje-yapısı)
- [Veritabanı Şeması](#-veritabanı-şeması)
- [API Endpoints](#-api-endpoints)
- [Gamification Sistemi](#-gamification-sistemi)
- [Geliştirme Notları](#-geliştirme-notları)
- [Özellik Detayları](#-özellik-detayları)
- [Katkıda Bulunma](#-katkıda-bulunma)
- [Lisans](#-lisans)

## ✨ Özellikler

### 🎮 Gamification Sistemi
- **XP (Deneyim Puanı) Sistemi**: Her aktivite için XP kazanma
- **Seviye Sistemi**: XP'ye dayalı otomatik seviye atlama
- **Günlük Challenges**: Her gün yeni hedefler ve ödüller
- **Achievement Sistemi**: Özel başarılar ve rozetler
- **Leaderboard**: Kullanıcılar arası rekabet
- **Streak Takibi**: Günlük çalışma serisi takibi

### ⏱️ Gelişmiş Timer Özellikleri
- **Real-time Timer**: Anlık zaman takibi
- **Pomodoro Tekniği**: 25 dakikalık odaklanma seansları
- **Deep Focus Mode**: 50 dakikalık derin odaklanma
- **Esnek Timer**: Özelleştirilebilir süre ayarları
- **Pause/Resume**: Timer'ı durdurma ve devam ettirme
- **Ses Bildirimleri**: Sesli uyarılar ve bildirimler

### 📊 Proje ve Görev Yönetimi
- **Proje Oluşturma**: Müşteri ve renk kodlaması ile
- **Görev Yönetimi**: Öncelik ve tamamlanma durumu takibi
- **Hiyerarşik Yapı**: Proje > Görev > Timer ilişkisi
- **Arşivleme**: Tamamlanan projeleri arşivleme
- **Filtreleme**: Gelişmiş arama ve filtreleme seçenekleri

### 📈 Analitik ve Raporlama
- **Zaman Analizi**: Detaylı zaman harcama raporları
- **Proje Bazlı Raporlar**: Proje başına zaman dağılımı
- **Günlük/Haftalık/Aylık Görünümler**: Farklı zaman aralıkları
- **Verimlilik Metrikleri**: Performans göstergeleri
- **Export Özelliği**: Excel ve CSV formatında dışa aktarma

### 🔐 Güvenlik ve Kimlik Doğrulama
- **Clerk Integration**: Modern kimlik doğrulama
- **NextAuth.js**: Güvenli oturum yönetimi
- **Şifre Sıfırlama**: E-posta ile şifre yenileme
- **Güvenli API**: JWT tabanlı API güvenliği

## 🛠️ Teknoloji Stack'i

### Frontend
- **Next.js 15**: React tabanlı full-stack framework
- **TypeScript 5**: Tip güvenliği ve geliştirici deneyimi
- **Tailwind CSS 4**: Utility-first CSS framework
- **shadcn/ui**: Modern UI bileşen kütüphanesi
- **Radix UI**: Erişilebilir UI primitifleri
- **Zustand**: Hafif state management
- **React Hook Form**: Form yönetimi
- **Zod**: Schema validation

### Backend
- **Next.js API Routes**: Serverless API endpoints
- **Prisma ORM**: Type-safe veritabanı erişimi
- **PostgreSQL**: Ana veritabanı
- **NextAuth.js**: Kimlik doğrulama
- **Clerk**: Modern auth provider

### Geliştirme Araçları
- **ESLint**: Kod kalitesi
- **Prettier**: Kod formatlaması
- **Husky**: Git hooks
- **TypeScript**: Statik tip kontrolü

## 🚀 Kurulum ve Çalıştırma

### Gereksinimler
- Node.js 18+ 
- PostgreSQL 14+
- pnpm (önerilen) veya npm

### 1. Projeyi Klonlayın
```bash
git clone https://github.com/your-username/time-tracker.git
cd time-tracker
```

### 2. Bağımlılıkları Yükleyin
```bash
pnpm install
# veya
npm install
```

### 3. Ortam Değişkenlerini Ayarlayın
`.env.local` dosyası oluşturun:
```env
# Veritabanı
DATABASE_URL="postgresql://username:password@localhost:5432/verimly"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Clerk (opsiyonel)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your-clerk-key"
CLERK_SECRET_KEY="your-clerk-secret"
```

### 4. Veritabanını Hazırlayın
```bash
# Prisma migration
pnpm db:migrate

# Seed data (opsiyonel)
pnpm db:seed
```

### 5. Uygulamayı Başlatın
```bash
pnpm dev
```

Uygulama `http://localhost:3000` adresinde çalışacaktır.

## 📁 Proje Yapısı

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API endpoints
│   │   ├── auth/          # Kimlik doğrulama
│   │   ├── timers/        # Timer yönetimi
│   │   ├── projects/      # Proje yönetimi
│   │   ├── tasks/         # Görev yönetimi
│   │   ├── achievements/  # Başarı sistemi
│   │   ├── challenges/    # Günlük challenges
│   │   └── xp-history/    # XP geçmişi
│   ├── dashboard/         # Ana dashboard
│   ├── login/            # Giriş sayfası
│   ├── signup/           # Kayıt sayfası
│   └── layout.tsx        # Ana layout
├── components/            # React bileşenleri
│   ├── dashboard/        # Dashboard bileşenleri
│   ├── gamification/     # Gamification bileşenleri
│   ├── providers/        # Context providers
│   └── ui/              # shadcn/ui bileşenleri
├── contexts/             # React contexts
├── hooks/               # Custom hooks
├── lib/                 # Utility kütüphaneleri
│   ├── api/            # API helpers
│   ├── auth/           # Auth konfigürasyonu
│   ├── repositories/   # Veri erişim katmanı
│   ├── services/       # İş mantığı katmanı
│   └── utils/          # Yardımcı fonksiyonlar
├── types/              # TypeScript tip tanımları
└── middleware.ts       # Next.js middleware

prisma/
├── schema.prisma       # Veritabanı şeması
└── migrations/         # Veritabanı migration'ları
```

## 🗄️ Veritabanı Şeması

### Ana Modeller

#### User (Kullanıcı)
- Kimlik bilgileri ve profil
- XP ve seviye bilgileri
- Kullanıcı tercihleri
- Aktivite takibi

#### Project (Proje)
- Proje bilgileri ve müşteri
- Renk kodlaması
- Arşivleme durumu
- Kullanıcı ilişkisi

#### Task (Görev)
- Görev detayları
- Öncelik seviyeleri
- Tamamlanma durumu
- Proje ilişkisi

#### Timer (Zamanlayıcı)
- Zaman takip bilgileri
- Durum yönetimi (RUNNING, PAUSED, COMPLETED)
- Proje ve görev ilişkileri
- Faturalandırma bilgileri

#### TimeEntry (Zaman Girişi)
- Tamamlanan zaman kayıtları
- Raporlama için optimize edilmiş
- Faturalandırma desteği

### Gamification Modelleri

#### XPHistory (XP Geçmişi)
- XP kazanma/kaybetme kayıtları
- Aksiyon türleri
- Metadata desteği

#### UserChallenge (Kullanıcı Challenges)
- Günlük hedefler
- İlerleme takibi
- XP ödülleri

#### UserAchievement (Kullanıcı Başarıları)
- Kazanılan başarılar
- Kategori ve nadir seviyesi
- Açılış tarihleri

### Enum Türleri
- `TimerStatus`: RUNNING, PAUSED, COMPLETED, CANCELLED
- `Priority`: LOW, MEDIUM, HIGH, URGENT
- `XPAction`: TIMER_STARTED, TIMER_COMPLETED, STREAK_BONUS, vb.
- `ChallengeType`: time, tasks, streak, focus
- `AchievementRarity`: common, rare, epic, legendary

## 🔌 API Endpoints

### Kimlik Doğrulama
- `POST /api/auth/register` - Kullanıcı kaydı
- `POST /api/auth/login` - Kullanıcı girişi
- `POST /api/auth/logout` - Çıkış
- `POST /api/auth/reset-password` - Şifre sıfırlama

### Timer Yönetimi
- `GET /api/timers` - Timer listesi
- `POST /api/timers` - Yeni timer oluşturma
- `PUT /api/timers/[id]` - Timer güncelleme
- `DELETE /api/timers/[id]` - Timer silme
- `POST /api/timers/[id]/start` - Timer başlatma
- `POST /api/timers/[id]/pause` - Timer durdurma
- `POST /api/timers/[id]/complete` - Timer tamamlama

### Proje Yönetimi
- `GET /api/projects` - Proje listesi
- `POST /api/projects` - Yeni proje oluşturma
- `PUT /api/projects/[id]` - Proje güncelleme
- `DELETE /api/projects/[id]` - Proje silme

### Görev Yönetimi
- `GET /api/tasks` - Görev listesi
- `POST /api/tasks` - Yeni görev oluşturma
- `PUT /api/tasks/[id]` - Görev güncelleme
- `DELETE /api/tasks/[id]` - Görev silme

### Gamification
- `GET /api/achievements` - Başarı listesi
- `POST /api/achievements/unlock` - Başarı açma
- `GET /api/challenges` - Günlük challenges
- `POST /api/challenges/progress` - Challenge ilerlemesi
- `GET /api/xp-history` - XP geçmişi
- `GET /api/leaderboard` - Liderlik tablosu

## 🎮 Gamification Sistemi

### XP Kazanma Yolları
- **Timer Başlatma**: +5 XP
- **Timer Tamamlama**: +10 XP
- **Günlük Hedef**: +100 XP
- **Streak Bonusu**: +25 XP
- **Seviye Atlama**: +50 XP
- **Challenge Tamamlama**: Değişken XP

### Seviye Sistemi
- Seviye = floor(sqrt(totalXP / 100)) + 1
- Her seviye için gereken XP: (seviye-1)² × 100
- Örnek: Seviye 5 için 1600 XP gerekli

### Challenge Türleri
- **Zaman Challenges**: Günlük çalışma süresi hedefleri
- **Görev Challenges**: Tamamlanan görev sayısı
- **Streak Challenges**: Ardışık çalışma günleri
- **Focus Challenges**: Kesintisiz odaklanma süreleri

### Achievement Kategorileri
- **Zaman**: Toplam çalışma süresi milestone'ları
- **Görevler**: Tamamlanan görev sayısı
- **Streak**: Ardışık çalışma günleri
- **Özel**: Benzersiz başarılar

## 🔧 Geliştirme Notları

### Performans Optimizasyonları
- PostgreSQL indexleri optimize edilmiş
- API endpoint'leri cache desteği
- Lazy loading ve code splitting
- Image optimization

### Güvenlik Önlemleri
- CSRF koruması
- Rate limiting
- Input validation (Zod)
- SQL injection koruması (Prisma)

### Kod Kalitesi
- TypeScript strict mode
- ESLint ve Prettier konfigürasyonu
- Husky pre-commit hooks
- Unit test desteği

### Veritabanı Yönetimi
```bash
# Migration oluşturma
pnpm db:migrate:dev

# Veritabanı sıfırlama
pnpm db:reset

# Prisma Studio
pnpm db:studio

# Seed data
pnpm db:seed
```

### Test Komutları
```bash
# Unit testler
pnpm test

# E2E testler
pnpm test:e2e

# Test coverage
pnpm test:coverage
```

## 📊 Özellik Detayları

### Real-time Timer
- WebSocket bağlantısı ile anlık güncelleme
- Tarayıcı kapatılsa bile süre korunması
- Otomatik pause/resume özelliği
- Bildirim API entegrasyonu

### Pomodoro Tekniği
- 25 dakika odaklanma + 5 dakika mola
- Otomatik geçişler
- Ses ve görsel bildirimler
- İstatistik takibi

### Analitik Dashboard
- Günlük/haftalık/aylık görünümler
- Proje bazlı zaman dağılımı
- Verimlilik trendleri
- Export özelliği (Excel, CSV, PDF)

### Responsive Design
- Mobile-first yaklaşım
- Tablet ve desktop optimizasyonu
- Touch-friendly interface
- PWA desteği

## 🤝 Katkıda Bulunma

1. Projeyi fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

### Geliştirme Rehberi
- TypeScript kullanın
- ESLint kurallarına uyun
- Test yazın
- Commit mesajlarını anlamlı yapın
- Documentation güncelleyin

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 📞 İletişim

- **Proje Sahibi**: Osman Çağrı GENÇ
- **E-posta**: osman.cagri.genc@codifya.com
- **GitHub**: [@osmcgrgenc](https://github.com/osmcgrgenc)
- **LinkedIn**: [Osman Çağrı GENÇ](https://linkedin.com/in/osmcgrgenc)

---

**Verimly** ile çalışma verimliliğinizi artırın ve hedeflerinize ulaşın! 🚀
