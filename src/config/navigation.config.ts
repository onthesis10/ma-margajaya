export interface SubNavItem {
  title: string;
  href: string;
}

export interface NavItem {
  label: string;
  href: string;
  subItems?: SubNavItem[];
}

export const navigation: NavItem[] = [
  { 
    label: "Beranda", 
    href: "/",
    subItems: [
      { title: "Sambutan Kepala", href: "/#sambutan-section" },
      { title: "Statistik Madrasah", href: "/#stats-section" },
      { title: "Program Unggulan", href: "/#program-section" },
      { title: "Warta Terkini", href: "/#berita-section" }
    ]
  },
  { 
    label: "Profil", 
    href: "/profil",
    subItems: [
      { title: "Identitas Resmi", href: "/profil#identitas" },
      { title: "Visi & Misi", href: "/profil#visi-misi" },
      { title: "Panca Karakter", href: "/profil#karakter" },
      { title: "Sejarah Madrasah", href: "/profil#sejarah" },
      { title: "Bagan Organigram", href: "/profil#organigram" },
      { title: "Dewan Guru", href: "/profil#direktori-guru" }
    ]
  },
  { 
    label: "Akademik", 
    href: "/akademik",
    subItems: [
      { title: "Pilar Pendidikan", href: "/akademik#pilar-akademik" },
      { title: "Struktur Mapel", href: "/akademik#struktur-mapel" },
      { title: "Projek P5-PPRA", href: "/akademik#p5-ppra" },
      { title: "Jadwal Harian", href: "/akademik#jadwal-harian" },
      { title: "Standar Lulusan", href: "/akademik#standar-lulusan" }
    ]
  },
  { 
    label: "Kesiswaan", 
    href: "/kesiswaan",
    subItems: [
      { title: "Organisasi Siswa", href: "/kesiswaan#organisasi" },
      { title: "Ekstrakurikuler", href: "/kesiswaan#ekskul" },
      { title: "Tradisi & Agenda", href: "/kesiswaan#tradisi" },
      { title: "Jejak Prestasi", href: "/kesiswaan#prestasi" }
    ]
  },
  { 
    label: "Fasilitas", 
    href: "/fasilitas",
  },
  { 
    label: "Galeri", 
    href: "/galeri",
  },
  { 
    label: "Berita", 
    href: "/berita",
  },
  { 
    label: "Kontak", 
    href: "/kontak",
    subItems: [
      { title: "Lokasi & Peta", href: "/kontak#lokasi" },
      { title: "Layanan WhatsApp", href: "/kontak#whatsapp" },
      { title: "Konsultasi PPDB", href: "/kontak#konsultasi" }
    ]
  },
];
