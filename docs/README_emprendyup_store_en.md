# 🛍️ EmprendyUp Storefront – Modern eCommerce Boilerplate

This project is a **modern eCommerce boilerplate** for entrepreneurs in Colombia, built with **Next.js 15**, **GraphQL (Apollo Client)**, and a sleek UI/UX design—optimized to scale and connect multiple storefronts.

---

## 🚀 Technologies Used

- **Next.js 15 (App Router) + React + TypeScript**
- **Tailwind CSS** for styling
- Typography: **Roboto** or **Montserrat**
- **Apollo Client** for GraphQL integration
- **Built-in automated testing**
- Modular architecture, production-ready

---

## 🛒 Features

- ✅ Fully functional shopping cart
- ✅ Wishlist (Favorites) support
- ✅ **Abandoned cart** tracking and reminders
- ✅ **Product detail module** with up to 10 images
- ✅ Payment integration with **Colombian providers**: MercadoPago, Wompi, ePayco
- ✅ Modern UX/UI responsive for desktop and mobile
- ✅ Legal pages: Contact, Support, Terms and Conditions
- ✅ User account module: orders, bonuses, profile info, addresses
- ✅ Cookie notice banner
- ✅ Footer with social media links
- ✅ Friendly menu with burger layout for mobile and desktop:
  - Store
  - Cart
  - Customer support
  - Login / My account

---

## 📁 Project Structure

```
/app
  /products
  /cart
  /favorites
  /user
  /support
  /auth
/components
  /Navbar
  /Footer
  /ProductCard
  /ProductGallery
  /Cart
  /Favorites
/lib
  apollo.ts
  cart.ts
  auth.ts
/pages
  contact.tsx
  support.tsx
  terms.tsx
/prisma
/public
/styles
```

---

## 💳 Payment Integration

Each store can configure its own payment method:

- `MercadoPago`: checkout redirect or inline
- `Wompi`: redirect-based checkout
- `ePayco`: direct API integration
- Includes payment validation via webhook

---

## 🧪 Testing

- Unit testing with `Jest` + `Testing Library`
- e2e testing supported with `Playwright` (optional)

---

## 🔐 Security & UX

- Authentication handled via `NextAuth`
- Protected private routes for users
- Cookie consent banner on first visit

---

## 📦 Installation

```bash
npx degit emprendyup/store-boilerplate sample-store
cd sample-store
npm install
cp .env.example .env.local
# Add your payment keys
npm run dev
```

---

Ready to build your storefront? This template gets you online in days, not months.
