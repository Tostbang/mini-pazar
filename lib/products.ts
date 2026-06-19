export type Product = {
  id: string
  name: string
  subName?: string
  vendor: string
  weight: string
  dollars: string
  cents: string
  image: string
  discount?: number
  rating?: number
  reviews?: number
}

export type CartProductMeta = {
  productId: number
  productName: string
  productImageUrl: string | null
  unitPrice: number
  stock: number
}

export const products: Record<string, Product> = {
  cabbage: {
    id: "cabbage",
    name: "Lahana",
    subName: "(Yerli Lahana)",
    vendor: "Yerel Market",
    weight: "500 gr.",
    dollars: "09",
    cents: "29",
    image: "/products/cabbage.png",
    rating: 4.5,
    reviews: 15,
  },
  carrot: {
    id: "carrot",
    name: "Havuç",
    subName: "(Yerli Havuç)",
    vendor: "Yerel Market",
    weight: "500 gr.",
    dollars: "19",
    cents: "29",
    image: "/products/carrot.png",
    rating: 4.7,
    reviews: 22,
  },
  cucumber: {
    id: "cucumber",
    name: "Salatalık",
    subName: "(Yerli Salatalık)",
    vendor: "Yerel Market",
    weight: "500 gr.",
    dollars: "04",
    cents: "29",
    image: "/products/cucumber.png",
    rating: 4.4,
    reviews: 9,
  },
  beetroot: {
    id: "beetroot",
    name: "Pancar",
    subName: "(Yerel Dükkan)",
    vendor: "Yerel Market",
    weight: "500 gr.",
    dollars: "17",
    cents: "29",
    image: "/products/beetroot.png",
    rating: 4.6,
    reviews: 18,
  },
  avocado: {
    id: "avocado",
    name: "Avokado",
    subName: "(Yerel Dükkan)",
    vendor: "Yerel Market",
    weight: "500 gr.",
    dollars: "12",
    cents: "29",
    image: "/products/avocado.png",
    rating: 4.8,
    reviews: 31,
  },
  "szam-amm": {
    id: "szam-amm",
    name: "Szam amm",
    subName: "(İşlenmiş Gıda)",
    vendor: "Yerel Market",
    weight: "500 gr.",
    dollars: "14",
    cents: "29",
    image: "/products/process-food.png",
    rating: 4.2,
    reviews: 7,
  },
  beef: {
    id: "beef",
    name: "Karışık Dana",
    subName: "(Kemikli)",
    vendor: "Et Marketi",
    weight: "500 gr.",
    dollars: "16",
    cents: "29",
    image: "/products/beef.png",
    rating: 4.5,
    reviews: 12,
  },
  "cold-drinks": {
    id: "cold-drinks",
    name: "Soğuk İçecek",
    subName: "(Sprite)",
    vendor: "Yerel Market",
    weight: "500 gr.",
    dollars: "18",
    cents: "29",
    image: "/products/soda-can.png",
    rating: 4.3,
    reviews: 25,
  },
  "plant-hunter": {
    id: "plant-hunter",
    name: "Plant Hunter",
    subName: "(Dondurulmuş Paket)",
    vendor: "Dondurulmuş Gıda Marketi",
    weight: "500 gr.",
    dollars: "20",
    cents: "29",
    image: "/products/frozen-pack.png",
    rating: 4.1,
    reviews: 5,
  },
  "lays-chips": {
    id: "lays-chips",
    name: "Lays Cips",
    subName: "(Pastırmalı)",
    vendor: "Atıştırmalık Marketi",
    weight: "500 gr.",
    dollars: "21",
    cents: "29",
    image: "/products/chips.png",
    rating: 4.6,
    reviews: 40,
  },
  flour: {
    id: "flour",
    name: "Tam Buğday Unu",
    subName: "(Organik Un)",
    vendor: "Bevmo Market",
    weight: "500 gr.",
    dollars: "429",
    cents: "12",
    image: "/products/flour.png",
    discount: 70,
    rating: 4.5,
    reviews: 15,
  },
  "peanut-butter": {
    id: "peanut-butter",
    name: "Bonduelle Karışık",
    subName: "(İşlenmiş Gıda)",
    vendor: "Yerel Market",
    weight: "500 gr.",
    dollars: "11",
    cents: "29",
    image: "/products/peanut-butter.png",
    rating: 4.7,
    reviews: 28,
  },
  corn: {
    id: "corn",
    name: "Organik Mısır Konservesi",
    subName: "(Tam Mısır Taneleri)",
    vendor: "Yerel Bakkal",
    weight: "500 gr.",
    dollars: "09",
    cents: "29",
    image: "/products/corn-can.png",
    rating: 4.4,
    reviews: 14,
  },
  chicken: {
    id: "chicken",
    name: "Fesleğenli Tavuklu Penne",
    subName: "(Dondurulmuş Yemek)",
    vendor: "Dondurulmuş Gıda Marketi",
    weight: "500 gr.",
    dollars: "15",
    cents: "29",
    image: "/products/chicken.png",
    rating: 4.5,
    reviews: 19,
  },
  fish: {
    id: "fish",
    name: "Jambonlu Mantarlı Pizza",
    subName: "(Dondurulmuş Paket)",
    vendor: "Taze Et Marketi",
    weight: "500 gr.",
    dollars: "18",
    cents: "29",
    image: "/products/fish.png",
    rating: 4.3,
    reviews: 11,
  },
  "frozen-deer": {
    id: "frozen-deer",
    name: "Organik Dondurulmuş Geyik Eti",
    subName: "500 gr.",
    vendor: "Et Marketi",
    weight: "500 gr.",
    dollars: "14",
    cents: "29",
    image: "/products/beef.png",
    rating: 4.5,
    reviews: 12,
  },
  "frozen-fish": {
    id: "frozen-fish",
    name: "Taze Dondurulmuş Balık",
    subName: "500 gr.",
    vendor: "Taze Et Marketi",
    weight: "500 gr.",
    dollars: "18",
    cents: "29",
    image: "/products/fish.png",
    rating: 4.3,
    reviews: 11,
  },
  "bonduelle-mix": {
    id: "bonduelle-mix",
    name: "Bonduelle Karışık",
    subName: "500 gr.",
    vendor: "Yerel Market",
    weight: "500 gr.",
    dollars: "20",
    cents: "29",
    image: "/products/frozen-mix.png",
    rating: 4.7,
    reviews: 28,
  },
  "frozen-meat": {
    id: "frozen-meat",
    name: "Dondurulmuş Kemiksiz Et",
    subName: "500 gr.",
    vendor: "Et Marketi",
    weight: "500 gr.",
    dollars: "08",
    cents: "29",
    image: "/products/beef.png",
    rating: 4.5,
    reviews: 12,
  },
  "chicken-penne": {
    id: "chicken-penne",
    name: "Fesleğenli Tavuklu Penne",
    subName: "500 gr.",
    vendor: "Dondurulmuş Gıda Marketi",
    weight: "500 gr.",
    dollars: "14",
    cents: "29",
    image: "/products/chicken.png",
    rating: 4.5,
    reviews: 19,
  },
  "onion-rings": {
    id: "onion-rings",
    name: "Tavuklu Soğan Halkası",
    subName: "500 gr.",
    vendor: "Dondurulmuş Gıda Marketi",
    weight: "500 gr.",
    dollars: "15",
    cents: "29",
    image: "/products/frozen-mix.png",
    rating: 4.6,
    reviews: 16,
  },
  "pizza-ham": {
    id: "pizza-ham",
    name: "Jambonlu Mantarlı Pizza",
    subName: "500 gr.",
    vendor: "Taze Et Marketi",
    weight: "500 gr.",
    dollars: "18",
    cents: "29",
    image: "/products/fish.png",
    rating: 4.3,
    reviews: 11,
  },
  "bucket-pops": {
    id: "bucket-pops",
    name: "Patlamış Mısır Kovası",
    subName: "500 gr.",
    vendor: "Atıştırmalık Marketi",
    weight: "500 gr.",
    dollars: "08",
    cents: "29",
    image: "/products/chips.png",
    rating: 4.6,
    reviews: 40,
  },
  }

  const slugToProductId: Record<string, number> = Object.keys(products).reduce<
    Record<string, number>
  >((acc, slug, index) => {
    acc[slug] = 1001 + index
    return acc
  }, {})

  export function getCartProductMeta(product: Product): CartProductMeta {
    return {
      productId: slugToProductId[product.id] ?? 0,
      productName: product.name,
      productImageUrl: product.image,
      unitPrice: Number(`${product.dollars}.${product.cents}`),
      stock: 999,
    }
  }

  export const productList = Object.values(products)

  export const youMightNeed = [
  "beetroot",
  "avocado",
  "szam-amm",
  "beef",
  "cold-drinks",
  "plant-hunter",
  "carrot",
  "cucumber",
  "lays-chips",
  "cabbage",
  ]

export const weeklyBestSelling = [
  "frozen-deer",
  "frozen-fish",
  "bonduelle-mix",
  "frozen-meat",
  "chicken-penne",
]

  export const justForYou = [
    "chicken-penne",
    "onion-rings",
    "pizza-ham",
    "bucket-pops",
    "bonduelle-mix",
  ]

  export const mostSelling = [
    "cabbage",
    "plant-hunter",
    "carrot",
    "cucumber",
    "chicken-penne",
  ]
