# 🛍️ EmprendyUp Store - Modern eCommerce Boilerplate

A modern, scalable eCommerce boilerplate built specifically for Colombian entrepreneurs using Next.js 15, TypeScript, and Tailwind CSS with **multi-store configuration system**.

## 🚀 Features

- ✅ **Modern Stack**: Next.js 15, React 19, TypeScript, Tailwind CSS
- ✅ **Multi-Store System**: Configure multiple stores with different branding and settings
- ✅ **eCommerce Ready**: Shopping cart, favorites, product catalog
- ✅ **Colombian Payment Integration**: MercadoPago, Wompi, ePayco
- ✅ **Authentication**: NextAuth.js with multiple providers
- ✅ **Store Admin Panel**: Complete configuration interface
- ✅ **Responsive Design**: Mobile-first approach
- ✅ **Testing**: Jest + Testing Library setup
- ✅ **Type Safety**: Full TypeScript implementation
- ✅ **Modern UI**: Beautiful, accessible components

## 🏪 Multi-Store Configuration

The boilerplate includes a powerful multi-store system that allows you to:

- 🎨 **Custom Branding**: Logos, colors, themes per store
- 🏢 **Business Settings**: Different business info and contact details
- � **Payment Methods**: Individual payment provider configurations
- 🚚 **Shipping Rules**: Store-specific shipping and tax settings
- 🔍 **SEO Settings**: Custom meta tags and social media integration
- 📱 **Admin Panel**: Easy-to-use configuration interface at `/admin/store`

### Predefined Store Templates

Choose from 5 ready-to-use store templates:

1. **Fashion Store** - Pink & elegant design for clothing and accessories
2. **Electronics Store** - Blue & tech-focused for gadgets and electronics
3. **Food Store** - Green & fresh for food and beverages
4. **Beauty Store** - Purple & luxury for cosmetics and beauty products
5. **Home Store** - Orange & cozy for furniture and home decor

## �🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Prisma ORM with PostgreSQL
- **Authentication**: NextAuth.js
- **GraphQL**: Apollo Client ready
- **Icons**: Lucide React
- **Testing**: Jest + Testing Library
- **Fonts**: Roboto & Montserrat
- **Multi-Store**: React Context + Service Layer

## 📦 Installation

1. **Clone or use the template**:

   ```bash
   npx create-next-app@latest my-store --example https://github.com/your-repo/emprendyup-store-boilerplate
   # or
   git clone https://github.com/your-repo/emprendyup-store-boilerplate.git
   cd emprendyup-store-boilerplate
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Set up environment variables**:

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your configuration.

4. **Set up the database**:

   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**:

   ```bash
   npm run dev
   ```

6. **Open** [http://localhost:3000](http://localhost:3000) in your browser.

## ⚡ Quick Start - Multi-Store Setup

1. **Access the admin panel**: Go to `/admin/store`
2. **Choose a template**: Select from Fashion, Electronics, Food, Beauty, or Home
3. **Customize your store**:
   - Set store name and description
   - Upload your logo and choose colors
   - Configure payment methods
   - Set shipping and tax rates
4. **Save and enjoy**: Your store is ready with custom branding!

For detailed configuration, see [Multi-Store Setup Guide](./docs/MULTI_STORE_SETUP.md).

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js 15 App Router
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Homepage
│   ├── admin/             # Admin panel
│   │   └── store/         # Store configuration
│   ├── products/          # Product pages
│   ├── cart/              # Shopping cart
│   ├── favorites/         # User favorites
│   ├── auth/              # Authentication
│   └── support/           # Customer support
├── components/            # Reusable components
│   ├── Navbar/           # Navigation component
│   ├── Footer/           # Footer component
│   ├── ProductCard/      # Product display
│   ├── Cart/             # Cart functionality
│   ├── Favorites/        # Favorites management
│   ├── StoreProvider.tsx # Store context
│   └── StoreConfigPanel.tsx # Admin panel
├── lib/                  # Utility libraries
│   ├── apollo.ts         # GraphQL client
│   ├── store-config.ts   # Multi-store configuration
│   ├── auth.ts           # Authentication config
│   └── cart.ts           # Cart service
└── __tests__/            # Test files
```

## 🎨 Customization

### Colors & Branding

Update your brand colors in `tailwind.config.ts` and component styles.

### Typography

The project uses Roboto and Montserrat fonts. Update in `layout.tsx` if needed.

### Payment Providers

Configure your payment methods in the environment variables:

- **MercadoPago**: For Argentina, Brazil, Chile, Colombia, Mexico, Peru, Uruguay
- **Wompi**: Colombian payment gateway
- **ePayco**: Latin American payment solutions

## 🧪 Testing

Run tests with:

```bash
npm test           # Run all tests
npm run test:watch # Run tests in watch mode
npm run test:coverage # Run tests with coverage
```

## 🚀 Deployment

### Vercel (Recommended)

```bash
npm run build
```

Deploy to [Vercel](https://vercel.com) for the best Next.js experience.

### Other Platforms

The application works on any platform that supports Node.js:

- Netlify
- Railway
- Digital Ocean
- AWS
- Google Cloud

## 🔧 Configuration

### Environment Variables

```env
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_GRAPHQL_ENDPOINT=your-graphql-endpoint
DATABASE_URL=your-database-url
MERCADOPAGO_ACCESS_TOKEN=your-token
WOMPI_PUBLIC_KEY=your-key
EPAYCO_PUBLIC_KEY=your-key
```

### Database Setup (Optional)

If using Prisma:

```bash
npx prisma init
npx prisma migrate dev
npx prisma generate
```

## 📱 Features Overview

### Shopping Cart

- Add/remove products
- Quantity management
- Colombian tax calculation (19% IVA)
- Free shipping over $150,000 COP
- Local storage persistence

### Authentication

- Email/password login
- Social login support (Google, Facebook)
- Protected routes
- User session management

### Product Catalog

- Product grid with filters
- Search functionality
- Category organization
- Product detail pages with galleries

### Colombian Specific

- Currency formatting (COP)
- Tax calculations (IVA 19%)
- Colombian payment methods
- Spanish language interface

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 💡 Support

- 📧 Email: soporte@emprendyup.com
- 📞 Phone: +57 (1) 234-5678
- 💬 Chat: Available 24/7 on our website

## 🙏 Acknowledgments

Built with ❤️ for Colombian entrepreneurs.

---

**Ready to build your online store?** This template gets you from zero to selling in days, not months! 🚀
