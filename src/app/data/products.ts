export interface Product {
  id: number;
  name: string;
  category: string;
  subcategory: string;
  brand: string;
  price: number;
  originalPrice: number | null;
  image: string;
  images: string[];
  rating: number;
  reviews: number;
  inStock: boolean;
  isNew: boolean;
  description: string;
  specifications?: {
    [key: string]: string;
  };
  features?: string[];
  accessories?: {
    name: string;
    image: string;
  }[];
}

export const products: Product[] = [
  // Guitars
  {
    id: 1,
    name: "Fender Stratocaster American Professional II",
    category: "guitar",
    subcategory: "electric",
    brand: "Fender",
    price: 15990000,
    originalPrice: 17990000,
    image: "/electric/electric-guitar.jpg",
    images: [
      "/electric/electric-guitar.jpg",
      "/wallpaper-1.jpg",
      "/wallpaper-2.jpg",
      "/wallpaper-3.jpg"
    ],
    rating: 4.8,
    reviews: 124,
    inStock: true,
    isNew: true,
    description: "Classic American electric guitar with modern features",
    specifications: {
      "Thương hiệu": "Fender",
      "Dáng đàn": "Stratocaster",
      "Chất liệu phần thân": "Alder",
      "Finish": "Gloss Polyester",
      "Cần đàn": "Maple",
      "Mặt phím": "Rosewood",
      "Khóa đàn": "Fender Locking Tuners",
      "Kiểu pickup": "Single-Coil",
      "Pickups": "3x V-Mod II Single-Coil",
      "Màu sắc": "Sunburst"
    },
    features: [
      "American Professional II V-Mod II single-coil pickups",
      "Deep 'C' neck profile with smooth satin finish",
      "2-Point Synchronized Tremolo with pop-in arm",
      "Locking tuners for improved tuning stability",
      "Narrow-tall frets for comfortable playing",
      "Deluxe molded case included"
    ],
    accessories: [
      { name: "Dây đàn", image: "/electric/acc/string.jpg" },
      { name: "Hộp đựng", image: "/electric/acc/cover.jpg" },
      { name: "Cáp kết nối", image: "/electric/acc/line.jpg" },
      { name: "Tài liệu", image: "/electric/acc/document.jpg" }
    ]
  },
  {
    id: 2,
    name: "Martin D-28 Acoustic Guitar",
    category: "guitar",
    subcategory: "acoustic",
    brand: "Martin",
    price: 12990000,
    originalPrice: null,
    image: "/acoustic/acoustic-guitar.jpg",
    images: [
      "/acoustic/acoustic-guitar.jpg",
      "/wallpaper-1.jpg",
      "/wallpaper-2.jpg",
      "/wallpaper-4.jpg"
    ],
    rating: 4.9,
    reviews: 89,
    inStock: true,
    isNew: false,
    description: "Premium acoustic guitar with rich, warm tone",
    specifications: {
      "Thương hiệu": "Martin",
      "Dáng đàn": "Dreadnought",
      "Chất liệu phần thân": "Solid Sitka Spruce",
      "Finish": "High Gloss",
      "Cần đàn": "Select Hardwood",
      "Mặt phím": "Solid Black Ebony",
      "Khóa đàn": "Martin Open Gear Tuners",
      "Kiểu pickup": "Acoustic",
      "Pickups": "Không có",
      "Màu sắc": "Natural"
    },
    features: [
      "Solid Sitka Spruce top for excellent projection",
      "Solid East Indian Rosewood back and sides",
      "Hand-fitted dovetail neck joint",
      "Forward-shifted X-bracing for enhanced bass response",
      "Bone nut and saddle for optimal tone transfer",
      "High-gloss finish with polished chrome hardware"
    ],
    accessories: [
      { name: "Dây đàn", image: "/acoustic/acc/string.jpg" },
      { name: "Hộp đựng", image: "/acoustic/acc/cover.jpg" },
      { name: "Tài liệu", image: "/acoustic/acc/document.jpg" },
    ]
  },
  {
    id: 3,
    name: "Gibson Les Paul Standard",
    category: "guitar",
    subcategory: "electric",
    brand: "Gibson",
    price: 18990000,
    originalPrice: 20990000,
    image: "/electric/electric-guitar.jpg",
    images: [
      "/electric/electric-guitar.jpg",
      "/wallpaper-2.jpg",
      "/wallpaper-3.jpg",
      "/wallpaper-4.jpg"
    ],
    rating: 4.7,
    reviews: 156,
    inStock: true,
    isNew: false,
    description: "Legendary electric guitar with powerful humbucker pickups",
    specifications: {
      "Thương hiệu": "Gibson",
      "Dáng đàn": "Les Paul",
      "Chất liệu phần thân": "Mahogany with Maple Cap",
      "Finish": "Nitrocellulose Lacquer",
      "Cần đàn": "Mahogany",
      "Mặt phím": "Rosewood",
      "Khóa đàn": "Gibson Deluxe Tuners",
      "Kiểu pickup": "Humbucker",
      "Pickups": "2x Burstbucker Pro Humbuckers",
      "Màu sắc": "Cherry Sunburst"
    },
    features: [
      "Burstbucker Pro humbucking pickups",
      "Mahogany body with maple cap for sustain",
      "Set mahogany neck with rosewood fretboard",
      "Tune-O-Matic bridge with stop bar tailpiece",
      "Nitrocellulose lacquer finish",
      "Gibson Deluxe hardshell case included"
    ],
    accessories: [
      { name: "Dây đàn", image: "/electric/acc/string.jpg" },
      { name: "Hộp đựng", image: "/electric/acc/cover.jpg" },
      { name: "Cáp kết nối", image: "/electric/acc/line.jpg" },
      { name: "Tài liệu", image: "/electric/acc/document.jpg" }
    ]
  },
  {
    id: 4,
    name: "Taylor 814ce Acoustic-Electric",
    category: "guitar",
    subcategory: "acoustic",
    brand: "Taylor",
    price: 13990000,
    originalPrice: null,
    image: "/acoustic/acoustic-guitar.jpg",
    images: [
      "/acoustic/acoustic-guitar.jpg",
      "/wallpaper-1.jpg",
      "/wallpaper-3.jpg",
      "/wallpaper-4.jpg"
    ],
    rating: 4.6,
    reviews: 203,
    inStock: true,
    isNew: true,
    description: "Versatile acoustic-electric with built-in electronics",
    specifications: {
      "Thương hiệu": "Taylor",
      "Dáng đàn": "Grand Auditorium",
      "Chất liệu phần thân": "Solid Sitka Spruce",
      "Finish": "High Gloss",
      "Cần đàn": "Tropical Mahogany",
      "Mặt phím": "Ebony",
      "Khóa đàn": "Taylor Gold Tuners",
      "Kiểu pickup": "Acoustic-Electric",
      "Pickups": "Taylor Expression System 2",
      "Màu sắc": "Natural"
    },
    features: [
      "Solid Sitka Spruce top with V-Class bracing",
      "Solid East Indian Rosewood back and sides",
      "Taylor Expression System 2 electronics",
      "Ebony fretboard with 20 frets",
      "Tropical Mahogany neck with satin finish",
      "Elixir Phosphor Bronze strings"
    ],
    accessories: [
      { name: "Dây đàn", image: "/acoustic/acc/string.jpg" },
      { name: "Hộp đựng", image: "/acoustic/acc/cover.jpg" },
      { name: "Cáp kết nối", image: "/acoustic/acc/line.jpg" },
    ]
  },
  {
    id: 5,
    name: "Ibanez RG550 Electric Guitar",
    category: "guitar",
    subcategory: "electric",
    brand: "Ibanez",
    price: 8990000,
    originalPrice: 10990000,
    image: "/electric/electric-guitar.jpg",
    images: [
      "/electric/electric-guitar.jpg",
      "/wallpaper-1.jpg",
      "/wallpaper-2.jpg",
      "/wallpaper-4.jpg"
    ],
    rating: 4.5,
    reviews: 78,
    inStock: true,
    isNew: false,
    description: "High-performance electric guitar for shredding",
    specifications: {
      "Thương hiệu": "Ibanez",
      "Dáng đàn": "RG",
      "Chất liệu phần thân": "Basswood",
      "Finish": "Gloss Polyester",
      "Cần đàn": "Maple",
      "Mặt phím": "Rosewood",
      "Khóa đàn": "Ibanez Cosmo Black",
      "Kiểu pickup": "Humbucker/Single",
      "Pickups": "3x V7, V8, S1 Pickups",
      "Màu sắc": "Cosmo Black"
    },
    features: [
      "Wizard III neck profile for fast playing",
      "Edge tremolo bridge for dive bombs and whammy effects",
      "V7, V8, S1 pickup configuration",
      "24 jumbo frets for extended range",
      "Cosmo Black hardware finish",
      "Basswood body for balanced tone"
    ],
    accessories: [
      { name: "Dây đàn", image: "/electric/acc/string.jpg" },
      { name: "Túi đựng", image: "/electric/acc/cover.jpg" },
      { name: "Cáp kết nối", image: "/electric/acc/line.jpg" },
      { name: "Tài liệu", image: "/electric/acc/document.jpg" }
    ]
  },
  {
    id: 6,
    name: "Yamaha FG830 Acoustic Guitar",
    category: "guitar",
    subcategory: "acoustic",
    brand: "Yamaha",
    price: 4590000,
    originalPrice: null,
    image: "/acoustic/acoustic-guitar.jpg",
    images: [
      "/acoustic/acoustic-guitar.jpg",
      "/wallpaper-2.jpg",
      "/wallpaper-3.jpg",
      "/wallpaper-4.jpg"
    ],
    rating: 4.4,
    reviews: 312,
    inStock: true,
    isNew: false,
    description: "Excellent value acoustic guitar with solid top",
    specifications: {
      "Thương hiệu": "Yamaha",
      "Dáng đàn": "Folk",
      "Chất liệu phần thân": "Solid Sitka Spruce",
      "Finish": "Natural Gloss",
      "Cần đàn": "Nato",
      "Mặt phím": "Rosewood",
      "Khóa đàn": "Die-cast Tuners",
      "Kiểu pickup": "Acoustic",
      "Pickups": "Không có",
      "Màu sắc": "Natural"
    },
    features: [
      "Solid Sitka Spruce top for great tone",
      "Nato back and sides for durability",
      "Rosewood fretboard and bridge",
      "Die-cast tuners for stable tuning",
      "Natural gloss finish",
      "Yamaha gig bag included"
    ],
    accessories: [
      { name: "Dây đàn", image: "/acoustic/acc/string.jpg" },
      { name: "Túi đựng", image: "/acoustic/acc/cover.jpg" },
      { name: "Tài liệu", image: "/acoustic/acc/document.jpg" },
    ]
  },
  // Amplifiers
  {
    id: 7,
    name: "Marshall JCM800 2203 Head",
    category: "amplifier",
    subcategory: "tube",
    brand: "Marshall",
    price: 24990000,
    originalPrice: 27990000,
    image: "/amp/amplifier.jpg",
    images: [
      "/amp/amplifier.jpg",
      "/wallpaper-1.jpg",
      "/wallpaper-2.jpg",
      "/wallpaper-3.jpg"
    ],
    rating: 4.9,
    reviews: 67,
    inStock: true,
    isNew: false,
    description: "Classic tube amplifier head with legendary tone",
    specifications: {
      "Thương hiệu": "Marshall",
      "Loại ampli": "Tube Head",
      "Công suất": "100W RMS",
      "Tubes": "4x EL34, 3x ECC83",
      "Channels": "1 Channel",
      "Controls": "Preamp, Master, Presence, Bass, Middle, Treble",
      "Effects": "Effects Loop",
      "Impedance": "4, 8, 16 Ohms",
      "Kích thước": "29.5 x 10.5 x 10 inches",
      "Trọng lượng": "50 lbs"
    },
    features: [
      "100W all-tube power section",
      "Classic Marshall JCM800 tone",
      "4x EL34 power tubes",
      "3x ECC83 preamp tubes",
      "Effects loop for external effects",
      "Multiple impedance outputs"
    ],
    accessories: [
      { name: "Kệ", image: "/amp/acc/stand.jpg" },
      { name: "Hướng dẫn sử dụng", image: "/amp/acc/document.jpg" },
      { name: "Dây nguồn", image: "/amp/acc/power.jpg" },
      { name: "Dây line", image: "/amp/acc/line.jpg" }
    ]
  },
  {
    id: 8,
    name: "Fender Blues Junior IV",
    category: "amplifier",
    subcategory: "tube",
    brand: "Fender",
    price: 12990000,
    originalPrice: null,
    image: "/amp/amplifier.jpg",
    images: [
      "/amp/amplifier.jpg",
      "/wallpaper-1.jpg",
      "/wallpaper-2.jpg",
      "/wallpaper-4.jpg"
    ],
    rating: 4.7,
    reviews: 145,
    inStock: true,
    isNew: true,
    description: "Compact tube combo amp with classic Fender tone",
    specifications: {
      "Thương hiệu": "Fender",
      "Loại ampli": "Tube Combo",
      "Công suất": "15W RMS",
      "Tubes": "2x 6V6, 3x 12AX7",
      "Speaker": "12-inch Celestion A-Type",
      "Controls": "Volume, Master, Treble, Middle, Bass, Reverb",
      "Effects": "Spring Reverb",
      "Kích thước": "18 x 16.5 x 9.5 inches",
      "Trọng lượng": "31 lbs"
    },
    features: [
      "15W all-tube power section",
      "2x 6V6 power tubes",
      "3x 12AX7 preamp tubes",
      "12-inch Celestion A-Type speaker",
      "Spring reverb tank",
      "Classic Fender tone stack"
    ],
    accessories: [
      { name: "Kệ", image: "/amp/acc/stand.jpg" },
      { name: "Hướng dẫn sử dụng", image: "/amp/acc/document.jpg" },
      { name: "Dây nguồn", image: "/amp/acc/power.jpg" },
      { name: "Dây line", image: "/amp/acc/line.jpg" }
    ]
  },
  {
    id: 9,
    name: "Boss Katana 100 MkII",
    category: "amplifier",
    subcategory: "solid-state",
    brand: "Boss",
    price: 8990000,
    originalPrice: 10990000,
    image: "/amp/amplifier.jpg",
    images: [
      "/amp/amplifier.jpg",
      "/wallpaper-2.jpg",
      "/wallpaper-3.jpg",
      "/wallpaper-4.jpg"
    ],
    rating: 4.6,
    reviews: 234,
    inStock: true,
    isNew: false,
    description: "Versatile solid-state amp with built-in effects",
    specifications: {
      "Thương hiệu": "Boss",
      "Loại ampli": "Solid-State Combo",
      "Công suất": "100W RMS",
      "Speaker": "12-inch Custom Speaker",
      "Channels": "4 Channels (Clean, Crunch, Lead, Brown)",
      "Effects": "60 Built-in Effects",
      "Connectivity": "USB, Line Out, Headphone Out",
      "Kích thước": "20.5 x 19.7 x 10.2 inches",
      "Trọng lượng": "26.5 lbs"
    },
    features: [
      "100W solid-state power",
      "60 built-in Boss effects",
      "4 distinct amp channels",
      "USB recording capability",
      "Headphone output for silent practice",
      "Boss Tone Studio software compatibility"
    ],
    accessories: [
      { name: "Kệ", image: "/amp/acc/stand.jpg" },
      { name: "Hướng dẫn sử dụng", image: "/amp/acc/document.jpg" },
      { name: "Dây nguồn", image: "/amp/acc/power.jpg" },
      { name: "Dây AUX", image: "/amp/acc/aux-cable.jpg" }
    ]
  },
  {
    id: 10,
    name: "Orange Crush 35RT",
    category: "amplifier",
    subcategory: "solid-state",
    brand: "Orange",
    price: 5990000,
    originalPrice: null,
    image: "/amp/amplifier.jpg",
    images: [
      "/amp/amplifier.jpg",
      "/wallpaper-1.jpg",
      "/wallpaper-3.jpg",
      "/wallpaper-4.jpg"
    ],
    rating: 4.5,
    reviews: 189,
    inStock: true,
    isNew: false,
    description: "Affordable solid-state amp with Orange character",
    specifications: {
      "Thương hiệu": "Orange",
      "Loại ampli": "Solid-State Combo",
      "Công suất": "35W RMS",
      "Speaker": "10-inch Voice of the World Speaker",
      "Channels": "2 Channels (Clean, Dirty)",
      "Effects": "Built-in Reverb",
      "Connectivity": "Aux In, Headphone Out",
      "Kích thước": "16.5 x 15.7 x 8.7 inches",
      "Trọng lượng": "18.5 lbs"
    },
    features: [
      "35W solid-state power",
      "10-inch Voice of the World speaker",
      "Clean and Dirty channels",
      "Built-in reverb effect",
      "Aux input for backing tracks",
      "Headphone output for practice"
    ],
    accessories: [
      { name: "Kệ", image: "/amp/acc/stand.jpg" },
      { name: "Hướng dẫn sử dụng", image: "/amp/acc/document.jpg" },
      { name: "Dây nguồn", image: "/amp/acc/power.jpg" },
      { name: "Dây AUX", image: "/amp/acc/aux-cable.jpg" }
    ]
  },
  {
    id: 11,
    name: "Vox AC30C2",
    category: "amplifier",
    subcategory: "tube",
    brand: "Vox",
    price: 19990000,
    originalPrice: 22990000,
    image: "/amp/amplifier.jpg",
    images: [
      "/amp/amplifier.jpg",
      "/wallpaper-1.jpg",
      "/wallpaper-2.jpg",
      "/wallpaper-3.jpg"
    ],
    rating: 4.8,
    reviews: 98,
    inStock: true,
    isNew: false,
    description: "Iconic tube combo amp with British character",
    specifications: {
      "Thương hiệu": "Vox",
      "Loại ampli": "Tube Combo",
      "Công suất": "30W RMS",
      "Tubes": "4x EL84, 3x 12AX7",
      "Speakers": "2x 12-inch Celestion G12M Greenback",
      "Channels": "2 Channels (Normal, Top Boost)",
      "Effects": "Spring Reverb, Tremolo",
      "Kích thước": "28 x 25 x 10 inches",
      "Trọng lượng": "70 lbs"
    },
    features: [
      "30W all-tube power section",
      "4x EL84 power tubes",
      "2x 12-inch Celestion Greenback speakers",
      "Normal and Top Boost channels",
      "Spring reverb and tremolo",
      "Classic British tone"
    ],
    accessories: [
      { name: "Kệ", image: "/amp/acc/stand.jpg" },
      { name: "Hướng dẫn sử dụng", image: "/amp/acc/document.jpg" },
      { name: "Dây nguồn", image: "/amp/acc/power.jpg" },
      { name: "Dây line", image: "/amp/acc/line.jpg" }
    ]
  },
  {
    id: 12,
    name: "Line 6 Spider V 60",
    category: "amplifier",
    subcategory: "modeling",
    brand: "Line 6",
    price: 6990000,
    originalPrice: 8990000,
    image: "/amp/amplifier.jpg",
    images: [
      "/amp/amplifier.jpg",
      "/wallpaper-2.jpg",
      "/wallpaper-3.jpg",
      "/wallpaper-4.jpg"
    ],
    rating: 4.3,
    reviews: 167,
    inStock: true,
    isNew: true,
    description: "Digital modeling amp with extensive effects",
    specifications: {
      "Thương hiệu": "Line 6",
      "Loại ampli": "Digital Modeling Combo",
      "Công suất": "60W RMS",
      "Speaker": "12-inch Custom Speaker",
      "Amp Models": "200+ Amp Models",
      "Effects": "200+ Effects",
      "Connectivity": "USB, Aux In, Headphone Out",
      "Kích thước": "20 x 18 x 9 inches",
      "Trọng lượng": "24 lbs"
    },
    features: [
      "60W digital modeling power",
      "200+ amp models",
      "200+ effects",
      "USB recording capability",
      "Aux input for backing tracks",
      "Headphone output for practice"
    ],
    accessories: [
      { name: "Kệ", image: "/amp/acc/stand.jpg" },
      { name: "Hướng dẫn sử dụng", image: "/amp/acc/document.jpg" },
      { name: "Dây nguồn", image: "/amp/acc/power.jpg" },
      { name: "Dây AUX", image: "/amp/acc/aux-cable.jpg" }
    ]
  },
  {
    id: 7,
    name: "Dây đàn guitar acoustic D'Addario EJ16",
    category: "accessories",
    subcategory: "strings",
    brand: "D'Addario",
    price: 180000,
    originalPrice: null,
    image: "/electric/acc/electric-string.jpg",
    images: [
      "/electric/acc/electric-string.jpg",
      "/wallpaper-1.jpg",
      "/wallpaper-2.jpg"
    ],
    rating: 4.6,
    reviews: 89,
    inStock: true,
    isNew: false,
    description: "Dây đàn guitar acoustic chất lượng cao, âm thanh sáng và vang",
    specifications: {
      "Thương hiệu": "D'Addario",
      "Loại dây": "Phosphor Bronze",
      "Gauge": "12-53",
      "Chất liệu": "Phosphor Bronze Wound",
      "Độ bền": "Cao",
      "Âm thanh": "Sáng, vang, ấm áp",
      "Phù hợp": "Guitar acoustic",
      "Bao gồm": "6 dây đầy đủ"
    },
    features: [
      "Âm thanh sáng và vang",
      "Độ bền cao",
      "Dễ chơi",
      "Phù hợp mọi phong cách âm nhạc",
      "Chất lượng ổn định"
    ],
    accessories: []
  },
  {
    id: 8,
    name: "Pick guitar Fender 351 Shape",
    category: "accessories",
    subcategory: "picks",
    brand: "Fender",
    price: 25000,
    originalPrice: null,
    image: "/electric/acc/electric-string.jpg",
    images: [
      "/electric/acc/electric-string.jpg",
      "/wallpaper-3.jpg"
    ],
    rating: 4.4,
    reviews: 156,
    inStock: true,
    isNew: false,
    description: "Pick guitar cổ điển với thiết kế truyền thống",
    specifications: {
      "Thương hiệu": "Fender",
      "Hình dạng": "351 Shape (Tortoise)",
      "Độ dày": "0.73mm",
      "Chất liệu": "Celluloid",
      "Màu sắc": "Tortoise",
      "Kích thước": "Standard",
      "Bề mặt": "Mờ",
      "Bao gồm": "12 picks"
    },
    features: [
      "Thiết kế cổ điển",
      "Cầm thoải mái",
      "Âm thanh tự nhiên",
      "Độ bền tốt",
      "Giá cả hợp lý"
    ],
    accessories: []
  },
  {
    id: 9,
    name: "Bao đàn guitar hardshell",
    category: "accessories",
    subcategory: "cases",
    brand: "Gator",
    price: 850000,
    originalPrice: 950000,
    image: "/electric/acc/electric-string.jpg",
    images: [
      "/electric/acc/electric-string.jpg",
      "/wallpaper-4.jpg"
    ],
    rating: 4.7,
    reviews: 73,
    inStock: true,
    isNew: true,
    description: "Bao đàn guitar cứng bảo vệ tối đa cho cây đàn của bạn",
    specifications: {
      "Thương hiệu": "Gator",
      "Loại bao": "Hardshell Case",
      "Chất liệu": "ABS Plastic",
      "Lớp lót": "Plush Interior",
      "Khóa": "2 khóa an toàn",
      "Tay cầm": "Có",
      "Kích thước": "Phù hợp guitar acoustic",
      "Trọng lượng": "2.5kg"
    },
    features: [
      "Bảo vệ tối đa",
      "Thiết kế chắc chắn",
      "Lớp lót mềm mại",
      "Khóa an toàn",
      "Dễ mang theo"
    ],
    accessories: []
  },
  {
    id: 10,
    name: "Capo guitar Kyser Quick-Change",
    category: "accessories",
    subcategory: "capos",
    brand: "Kyser",
    price: 320000,
    originalPrice: null,
    image: "/electric/acc/electric-string.jpg",
    images: [
      "/electric/acc/electric-string.jpg",
      "/wallpaper-1.jpg"
    ],
    rating: 4.8,
    reviews: 201,
    inStock: true,
    isNew: false,
    description: "Capo guitar chất lượng cao, dễ sử dụng và chính xác",
    specifications: {
      "Thương hiệu": "Kyser",
      "Loại capo": "Quick-Change",
      "Chất liệu": "Aluminum",
      "Lò xo": "Stainless Steel Spring",
      "Màu sắc": "Chrome",
      "Phù hợp": "Guitar acoustic/classical",
      "Độ chính xác": "Cao",
      "Dễ sử dụng": "Có"
    },
    features: [
      "Thiết kế đơn giản",
      "Dễ sử dụng một tay",
      "Độ chính xác cao",
      "Không làm lệch dây",
      "Bền bỉ"
    ],
    accessories: []
  },
  {
    id: 11,
    name: "Dây đàn guitar điện Ernie Ball Regular Slinky",
    category: "accessories",
    subcategory: "strings",
    brand: "Ernie Ball",
    price: 150000,
    originalPrice: null,
    image: "/electric/acc/electric-string.jpg",
    images: [
      "/electric/acc/electric-string.jpg",
      "/wallpaper-2.jpg"
    ],
    rating: 4.5,
    reviews: 134,
    inStock: true,
    isNew: false,
    description: "Dây đàn guitar điện phổ biến nhất thế giới",
    specifications: {
      "Thương hiệu": "Ernie Ball",
      "Loại dây": "Regular Slinky",
      "Gauge": "10-46",
      "Chất liệu": "Nickel Plated Steel",
      "Độ bền": "Tốt",
      "Âm thanh": "Sáng, sắc nét",
      "Phù hợp": "Guitar điện",
      "Bao gồm": "6 dây đầy đủ"
    },
    features: [
      "Âm thanh sáng sắc nét",
      "Độ bền tốt",
      "Dễ chơi",
      "Phù hợp mọi phong cách",
      "Giá cả hợp lý"
    ],
    accessories: []
  },
  {
    id: 12,
    name: "Strap đàn guitar Fender Deluxe",
    category: "accessories",
    subcategory: "straps",
    brand: "Fender",
    price: 280000,
    originalPrice: 320000,
    image: "/electric/acc/electric-string.jpg",
    images: [
      "/electric/acc/electric-string.jpg",
      "/wallpaper-3.jpg"
    ],
    rating: 4.3,
    reviews: 67,
    inStock: true,
    isNew: true,
    description: "Dây đeo đàn guitar cao cấp với thiết kế đẹp mắt",
    specifications: {
      "Thương hiệu": "Fender",
      "Loại dây": "Deluxe",
      "Chất liệu": "Leather + Nylon",
      "Chiều dài": "Adjustable 100-130cm",
      "Chiều rộng": "5cm",
      "Màu sắc": "Black",
      "Khóa": "Có",
      "Thiết kế": "Vintage"
    },
    features: [
      "Thiết kế vintage đẹp",
      "Chất liệu cao cấp",
      "Điều chỉnh chiều dài dễ dàng",
      "Thoải mái khi đeo",
      "Bền bỉ"
    ],
    accessories: []
  }
];