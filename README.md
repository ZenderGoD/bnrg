# 2XY - Premium Sneaker Store 👟

A modern, fully-responsive e-commerce website for premium sneakers, built with React and powered by Shopify. Experience the future of sneaker shopping with sleek animations, intuitive design, and seamless Shopify integration.

![2XY Hero](https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400&q=80)

## ✨ About 2XY

2XY is not just another sneaker store - it's a premium marketplace where style meets exceptional comfort. We curate exclusive collections for both men and women, featuring the world's most coveted sneaker brands with a focus on limited editions, athletic performance, and cutting-edge street fashion.

### 🎯 Our Collections
- **Premium Lifestyle** - Luxury sneakers for everyday elegance
- **Athletic Performance** - High-performance footwear for athletes
- **Street Fashion** - Bold designs that make a statement
- **Limited Editions** - Exclusive drops and collector's items

## 🚀 Features

### 🛍️ **Complete E-commerce Experience**
- **Shopify Integration** - Full product catalog and cart management
- **Real-time Inventory** - Live product availability and pricing
- **Secure Checkout** - Powered by Shopify's trusted payment system

### 🎨 **Premium User Experience**
- **Dark/Light Theme** - Seamless theme switching with system preference detection
- **Responsive Design** - Optimized for desktop, tablet, and mobile devices
- **Smooth Animations** - Framer Motion powered transitions and micro-interactions
- **Video Backgrounds** - Dynamic hero sections with cycling video content

### 🔍 **Advanced Shopping Tools**
- **Smart Search** - Find your perfect sneakers with intelligent filtering
- **Advanced Filtering** - Filter by category, price, size, color, brand, and tags
- **Product Discovery** - Collection-based browsing and recommendations
- **Quick Add to Cart** - Streamlined shopping experience

### 👤 **User Management**
- **Authentication System** - Secure login/logout with persistent sessions
- **User Profiles** - Personal dashboard for order history and preferences
- **Credit System** - Earn and share credits with friends through coupon codes

### ⚡ **Performance & Quality**
- **Skeleton Loaders** - Smooth loading states for better perceived performance
- **Error Handling** - Comprehensive error boundaries and 404 pages
- **SEO Optimized** - Proper meta tags and semantic HTML structure

## 🛠️ Technologies Used

### **Frontend Framework**
- **React 18** with TypeScript for type-safe development
- **Vite** for lightning-fast development and building
- **React Router DOM** for client-side routing

### **Styling & UI**
- **Tailwind CSS** for utility-first styling with custom design system
- **shadcn/ui** components for consistent, accessible UI elements
- **Custom CSS variables** for theming and design tokens

### **Animations & Interactions**
- **Framer Motion** for smooth animations and gestures
- **Custom hover effects** and micro-interactions
- **Page transitions** and loading animations

### **E-commerce Integration**
- **Shopify Storefront API** for product data and cart management
- **GraphQL** for efficient data fetching
- **Real-time cart updates** and inventory management

### **State Management**
- **React Context** for theme and cart state
- **TanStack Query** for server state management
- **Local Storage** for user preferences and cart persistence

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager
- Shopify store with Storefront API access

### 1. Clone the Repository
```bash
git clone <YOUR_GIT_URL>
cd 2xy-sneaker-store
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env.local` file in the root directory:
```env
VITE_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN=your-storefront-token
```

### 4. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🏪 Shopify Configuration

### Store Setup
1. **Create Collections**: Set up "mens-collection" and "womens-collection" in your Shopify admin
2. **Add Products**: Populate collections with your sneaker inventory
3. **Configure API**: Enable Storefront API access in your Shopify settings
4. **Upload Media**: Add product images and promotional videos to Shopify Files

### Required Collections
- `mens-collection` - Men's sneaker products
- `womens-collection` - Women's sneaker products
- Additional collections for filtering (optional)

### Media Assets
- Product images (multiple angles for hover effects)
- Hero section videos for dynamic backgrounds
- Collection showcase images

## 🎨 Design System

### Color Palette
The 2XY brand uses a sophisticated dark blue color scheme:
- **Primary**: Deep blue (#3B82F6) for main elements
- **Accent**: Complementary blue (#1E40AF) for highlights
- **Background**: Dynamic gradients with smooth transitions
- **Text**: High-contrast ratios for accessibility

### Typography
- **Headings**: Bold, modern sans-serif fonts
- **Body**: Clean, readable font stack with proper line spacing
- **Code**: Monospace fonts for technical elements

### Animation Principles
- **Smooth Transitions**: All interactions use easing functions
- **Micro-interactions**: Hover effects and button feedback
- **Page Transitions**: Seamless navigation between routes
- **Loading States**: Skeleton loaders for better UX

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── AuthModal.tsx   # Authentication modal
│   ├── CreditSystem.tsx # Credit and coupon system
│   ├── Header.tsx      # Navigation header
│   ├── Hero.tsx        # Hero section with video
│   ├── ProductCard.tsx # Product display component
│   └── ProductGrid.tsx # Product grid layout
├── contexts/           # React context providers
│   ├── CartContext.tsx # Shopping cart state
│   └── ThemeContext.tsx # Theme management
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
│   ├── shopify.ts      # Shopify API integration
│   └── utils.ts        # Helper functions
├── pages/              # Page components
│   ├── Index.tsx       # Home page
│   ├── Men.tsx         # Men's collection
│   ├── Women.tsx       # Women's collection
│   ├── Catalog.tsx     # Product catalog with filters
│   ├── Credits.tsx     # Credit system page
│   ├── Profile.tsx     # User profile
│   └── NotFound.tsx    # 404 error page
└── assets/             # Static assets
    ├── images/         # Product and UI images
    └── videos/         # Hero section videos

# Documentation Files
├── SHOPIFY_SETUP.md         # Shopify backend configuration guide
├── IMPLEMENTATION_GUIDE.md  # Technical implementation documentation
└── README.md                # This file
```

## 🔄 Credit System

The 2XY credit system allows customers to earn and share rewards with a comprehensive 40% cashback program:

### How It Works
1. **Earn 40% Back**: Get 40% back in credits on every purchase
2. **Share Credits**: Create gift cards to share credits with friends
3. **Use Credits**: Apply credits as payment at checkout
4. **Track History**: Monitor credit balance and transaction history

### Features
- **Real-time credit balance** updates from Shopify backend
- **Gift card creation** for sharing credits with friends
- **Store credit at checkout** - use credits as payment method
- **Refund to credits** - convert refunds to store credits
- **Transaction history** - complete audit trail of credit activities
- **Shopify integration** - full backend integration with metafields
  
  Note: Admin mutations (gift cards, credit writes) are performed via secure serverless functions under `/api/*`. Configure env vars on your hosting platform:
  - `SHOPIFY_STORE_DOMAIN`
  - `SHOPIFY_ADMIN_ACCESS_TOKEN`
  - `SHOPIFY_WEBHOOK_SECRET` (if using webhooks)

### 📚 Documentation
- **[Shopify Setup Guide](./SHOPIFY_SETUP.md)** - Complete configuration guide for Shopify backend
- **[Implementation Guide](./IMPLEMENTATION_GUIDE.md)** - Detailed technical documentation of the credit system implementation

> **Note**: The credit system requires proper Shopify configuration including customer metafields, Shopify Flow automation, and store credit settings. See the setup guide for complete instructions.

### 🧪 Dev Testing (no Shopify writes)

When running locally with zero credits, you can seed dev-only values to test the `/credits` UI without touching Shopify:

```js
localStorage.setItem('dev_credits_balance', '150');
localStorage.setItem('dev_credits_earned', '300');
localStorage.setItem('dev_credits_pending', '0');
localStorage.setItem('dev_credit_transactions', JSON.stringify([
  { id: 'txn_dev1', amount: 50, type: 'earned', description: 'Dev seed earned', createdAt: new Date().toISOString(), status: 'completed' }
]));
```

Reload `/credits` and you will see the seeded balance and history when the Shopify metafields return zeros.

## 🚀 Deployment

### Lovable Platform (Recommended)
Deploy directly through Lovable with one click:
1. Click the "Publish" button in the Lovable editor
2. Your site will be live on a Lovable subdomain
3. Configure custom domain in project settings (paid plans)

### Manual Deployment
For other platforms:
```bash
npm run build
npm run preview  # Test production build locally
```

Upload the `dist` folder to your hosting provider.

## 🔧 Development

### Available Scripts
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
npm run type-check # TypeScript type checking
```

### Code Quality
- **TypeScript** for type safety
- **ESLint** for code linting
- **Prettier** for code formatting (recommended)
- **Component-driven** development approach

## 🤝 Contributing

We welcome contributions to improve 2XY! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Maintain component modularity
- Write descriptive commit messages
- Test across different devices and browsers

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Shopify** for providing robust e-commerce infrastructure
- **shadcn/ui** for beautiful, accessible UI components
- **Framer Motion** for smooth animations
- **Tailwind CSS** for utility-first styling
- **Lovable** platform for streamlined development and deployment

## 📞 Support

For support and questions:
- 📧 Email: support@2xy.com
- 💬 Discord: [Join our community](https://discord.gg/2xy)
- 📖 Documentation: [docs.2xy.com](https://docs.2xy.com)

---

**Built with ❤️ by the 2XY Team**

*Step into excellence with 2XY - Where every step counts.*