import productRetatrutide from "../assets/product-4-new.jpeg";
import productGlow from "../assets/product-6-new.jpeg";
import productBpcTb from "../assets/product-1-new.jpeg";
import productTirzepatide from "../assets/product-2-new.jpeg";
import productNad from "../assets/product-5-new.jpeg";
import reta20Pen from "../assets/product-media/reta20-pen.jpg";
import reta20Open from "../assets/product-media/reta20-open.jpg";
import reta20Uv from "../assets/product-media/reta20-uv.jpg";
import glowPen from "../assets/product-media/glow-pen.jpg";
import glowOpen from "../assets/product-media/glow-open.jpg";
import glowUv from "../assets/product-media/glow-uv.jpg";
import bpcPen from "../assets/product-media/bpc-pen.jpg";
import bpcOpen from "../assets/product-media/bpc-open.jpg";
import bpcUv from "../assets/product-media/bpc-uv.jpg";
import tirzPen from "../assets/product-media/tirz-pen.jpg";
import tirzOpen from "../assets/product-media/tirz-open.jpg";
import tirzUv from "../assets/product-media/tirz-uv.jpg";
import nadPen from "../assets/product-media/nad-pen.jpg";
import nadOpen from "../assets/product-media/nad-open.jpg";
import nadUv from "../assets/product-media/nad-uv.jpg";
import aboutImg from "../assets/about-seo.webp";
import whyConsistent from "../assets/consistence-seo.webp";
import whyPurity from "../assets/purity-seo.webp";
import whyService from "../assets/service-seo.webp";
import whySupport from "../assets/support-seo.webp";
import review1 from "../assets/review1-seo.webp";
import review2 from "../assets/review-2-seo.webp";
import review3 from "../assets/review3-seo.webp";
import review4 from "../assets/review4-seo.webp";
import review5 from "../assets/review5-seo.webp";
import review6 from "../assets/review6-seo.webp";

export const site = {
  name: "Liora Healthcare",
  brandMark: "Liora",
  brandSub: "Healthcare",
  aboutImage: aboutImg,
  role: "Research-grade peptide supply",
  location: "Dubai · United Arab Emirates",
  email: "hello@liorahealthcare.com",
  phone: "+971 50 000 0000",
  whatsapp: "https://wa.me/971500000000",
  socials: [
    { label: "WhatsApp", href: "https://wa.me/971500000000" },
    { label: "Instagram", href: "https://instagram.com/liorahealthcare" },
    { label: "Email", href: "mailto:hello@liorahealthcare.com" },
  ],
  navLinks: [
    { label: "Home", href: "#home" },
    { label: "About", href: "#about" },
    { label: "Products", href: "#work" },
    { label: "Why Us", href: "#why-us" },
    { label: "FAQ", href: "#faq" },
    { label: "Contact", href: "#contact" },
  ],
};

export const heroCopy = {
  headlineTop: "Purity",
  headlineBottom: "First.",
  intro:
    "Research-grade peptides and supplement formulations, sourced from verified suppliers and packed to exacting standards — so every vial delivers the purity, potency, and consistency your work depends on.",
  available: "Now shipping worldwide",
};

export const aboutCopy = {
  heading: "Advancing modern research with smarter formulations.",
  paragraph:
    "We're committed to advancing high-quality peptide and supplement research through clean, reliable, and precisely developed formulations. Every product is sourced from verified suppliers and carefully packed to preserve consistency, purity, and integrity — from our facility to your bench.",
  stats: [
    { value: 99, suffix: "%+", label: "Formulation purity" },
    { value: 1000, suffix: "+", label: "Researchers served" },
    { value: 24, suffix: " h", label: "WhatsApp response" },
  ],
  signals: [
    { label: "Range", value: "Peptides · Supplements" },
    { label: "Sourcing", value: "Verified suppliers" },
    { label: "Support", value: "Fast WhatsApp" },
  ],
};

export const whyUs = [
  {
    number: "01",
    title: "Consistent results",
    description:
      "Sourced from manufacturers that follow strict testing, handling, and documentation standards on every product.",
    image: whyConsistent,
  },
  {
    number: "02",
    title: "Verified purity",
    description:
      "Every product undergoes thorough checking to maintain clean, high-quality formulations you can rely on.",
    image: whyPurity,
  },
  {
    number: "03",
    title: "Reliable service",
    description:
      "Every step — from order to delivery — is designed to provide a smooth, dependable customer experience.",
    image: whyService,
  },
  {
    number: "04",
    title: "Quick support",
    description:
      "Fast WhatsApp assistance for queries, updates, and product guidance, whenever you need it.",
    image: whySupport,
  },
];

export const services = [
  {
    number: "01",
    title: "Purity First",
    description:
      "Each product is checked thoroughly to maintain clean, high-quality formulations you can rely on.",
  },
  {
    number: "02",
    title: "Reliable Consistency",
    description:
      "Controlled processes ensure every unit is produced to uniform, repeatable standards.",
  },
  {
    number: "03",
    title: "Secure Packaging",
    description:
      "Every product is sealed and protected to preserve freshness, stability, and overall product integrity.",
  },
  {
    number: "04",
    title: "Quick WhatsApp Support",
    description:
      "Fast WhatsApp assistance for queries, updates, and product guidance — message us any time.",
  },
];

export const projects = [
  {
    id: "p1",
    title: "Retatrutide 20mg",
    sector: "Metabolic research",
    year: "AED 1,290",
    price: 1290,
    summary:
      "Triple-agonist of GLP-1, GIP and glucagon receptors. Supplied as 20 mg (4 × 5 mg doses) for metabolic and energy-pathway research.",
    description:
      "Retatrutide is a next-generation triple agonist designed to engage GLP-1, GIP, and glucagon receptors simultaneously. It is supplied lyophilized for laboratory reconstitution and is commonly used in metabolic, weight-regulation, and energy-pathway research models. Each vial is independently HPLC-tested and ships with a batch-specific certificate of analysis.",
    accent: "#ffeec8",
    image: productRetatrutide,
    subImages: [productRetatrutide, reta20Pen, reta20Open, reta20Uv],
    specs: [
      { label: "Purity", value: "≥99% HPLC" },
      { label: "Form", value: "Lyophilized powder" },
      { label: "Dose", value: "4 × 5 mg vials" },
      { label: "Storage", value: "-20°C, dry" },
    ],
  },
  {
    id: "p2",
    title: "Glow GHK-Cu",
    sector: "Recovery & cosmetic",
    year: "AED 1,199",
    price: 1199,
    summary:
      "Skin, hair and cellular-repair blend pairing BPC-157, TB500 and GHK-Cu. Studied in regeneration and tissue-repair research.",
    description:
      "A research blend pairing GHK-Cu with BPC-157 and TB-500 — three of the most studied peptides in regenerative and cosmetic research. Supplied as a sterile lyophilized powder with documented purity for skin, hair, and tissue-repair investigations.",
    accent: "#c9d8ff",
    image: productGlow,
    subImages: [productGlow, glowPen, glowOpen, glowUv],
    specs: [
      { label: "Purity", value: "≥98% HPLC" },
      { label: "Form", value: "Lyophilized blend" },
      { label: "Dose", value: "Multi-vial pack" },
      { label: "Storage", value: "-20°C, dry" },
    ],
  },
  {
    id: "p3",
    title: "BPC-157 & TB-500",
    sector: "Recovery research",
    year: "AED 999",
    price: 999,
    summary:
      "Recovery and repair pairing supplied at 40 mg (4 × 10 mg doses). Widely used in tissue-regeneration assays.",
    description:
      "A classic pairing for tissue-regeneration and recovery research. Each vial is lyophilized for reconstitution, with batch-level HPLC verification and mass-spec confirmation included with every shipment.",
    accent: "#d6ffd0",
    image: productBpcTb,
    subImages: [productBpcTb, bpcPen, bpcOpen, bpcUv],
    specs: [
      { label: "Purity", value: "≥99% HPLC" },
      { label: "Form", value: "Lyophilized powder" },
      { label: "Dose", value: "4 × 10 mg vials" },
      { label: "Storage", value: "-20°C, dry" },
    ],
  },
  {
    id: "p4",
    title: "Tirzepatide 40mg",
    sector: "Metabolic research",
    year: "AED 1,490",
    price: 1490,
    summary:
      "Dual agonist of GLP-1 and GIP receptors. Supplied as 40 mg (4 × 10 mg doses) for glucose-regulation and metabolic studies.",
    description:
      "Tirzepatide is a dual GLP-1 / GIP receptor agonist widely used in metabolic and glucose-regulation research. Supplied lyophilized at 40 mg total across four sealed vials, with a certificate of analysis included.",
    accent: "#ffd4c2",
    image: productTirzepatide,
    subImages: [productTirzepatide, tirzPen, tirzOpen, tirzUv],
    specs: [
      { label: "Purity", value: "≥99% HPLC" },
      { label: "Form", value: "Lyophilized powder" },
      { label: "Dose", value: "4 × 10 mg vials" },
      { label: "Storage", value: "-20°C, dry" },
    ],
  },
  {
    id: "p5",
    title: "NAD+ 1000mg",
    sector: "Cellular research",
    year: "AED 899",
    price: 899,
    summary:
      "Focus, brain cellular-repair and anti-aging research compound supplied at 1,000 mg for cellular-metabolism investigations.",
    description:
      "NAD+ (nicotinamide adenine dinucleotide) is a foundational coenzyme studied across cellular-metabolism, mitochondrial-health, and aging research. Supplied as a high-purity 1,000 mg vial for reconstitution.",
    accent: "#ffeec8",
    image: productNad,
    subImages: [productNad, nadPen, nadOpen, nadUv],
    specs: [
      { label: "Purity", value: "≥99% HPLC" },
      { label: "Form", value: "Lyophilized powder" },
      { label: "Dose", value: "1,000 mg vial" },
      { label: "Storage", value: "-20°C, dry" },
    ],
  },
];

export const testimonials = [
  {
    quote:
      "Fast support, reliable products, and a smooth ordering experience. The team truly delivers dependable quality every time.",
    name: "Ethan Carter",
    role: "Wellness Consultant",
    avatar: review1,
  },
  {
    quote:
      "Everything arrived securely, communication was excellent, and the overall service exceeded expectations for a premium brand.",
    name: "Samuel Bennett",
    role: "Fitness Coordinator",
    avatar: review2,
  },
  {
    quote:
      "Product consistency, helpful guidance, and quick responses made the entire process simple, smooth, and extremely satisfying.",
    name: "Michelle Reed",
    role: "Research Assistant",
    avatar: review3,
  },
  {
    quote:
      "Support actually answered questions about handling and storage. Most suppliers send a generic FAQ link and disappear.",
    name: "Marco Ruiz",
    role: "Procurement Lead, Vela Biotech",
    avatar: review4,
  },
  {
    quote:
      "Pricing is fair, freight is quick, and the certificate of analysis is more detailed than what we used to get from larger suppliers.",
    name: "Sasha Petrov",
    role: "Postdoctoral Researcher",
    avatar: review5,
  },
  {
    quote:
      "WhatsApp reply within the hour. That alone changed how we plan ordering for our team.",
    name: "Rohan Natarajan",
    role: "Co-founder, Ember Research",
    avatar: review6,
  },
];

export const faqItems = [
  {
    question: "What documentation comes with each order?",
    answer:
      "Every vial ships with a certificate of analysis listing lot number, synthesis date, HPLC purity, and mass-spec confirmation. Storage and handling notes are included on the packing slip.",
  },
  {
    question: "How is purity verified?",
    answer:
      "Each batch is independently tested by reverse-phase HPLC and high-resolution mass spectrometry. We retain a reference sample from every lot for cross-verification on request.",
  },
  {
    question: "How are shipments packaged?",
    answer:
      "Vials ship in insulated double-walled mailers with phase-change gel packs sized for the destination's transit window. Temperature loggers are included on orders above a set threshold or on request.",
  },
  {
    question: "Do you ship outside the UAE?",
    answer:
      "Yes — we currently dispatch across the GCC and to select international research addresses. Some destinations require additional import documentation; we'll confirm what's needed before processing.",
  },
  {
    question: "How long does delivery take?",
    answer:
      "UAE orders typically arrive within 24–48 hours of despatch. GCC orders arrive in 2–4 working days. International shipments depend on customs clearance at the destination.",
  },
  {
    question: "What's the return policy?",
    answer:
      "We don't accept returns on opened or temperature-compromised vials. If a shipment arrives damaged or out of spec, contact us within 48 hours of delivery and we'll replace or refund.",
  },
  {
    question: "How can I pay?",
    answer:
      "Bank transfer, card payments via our checkout, and crypto on request. Institutional purchase orders are accepted with prior credit approval.",
  },
];

export type Project = (typeof projects)[number];
export type Testimonial = (typeof testimonials)[number];
export type FaqItem = (typeof faqItems)[number];
