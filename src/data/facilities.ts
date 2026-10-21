export interface FacilityItem {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  description: string;
  specs: string[];
  image: string;
  heightClass: string;
}

export const facilities: FacilityItem[] = [
  {
    id: "kampus",
    title: "Gedung & Kampus Terpadu",
    subtitle: "Pusat Pembelajaran Representatif",
    category: "Akademik",
    description: "Gedung madrasah modern terintegrasi di lingkungan asri Kompleks Pondok Pesantren Darul Muawanah Sukadana, dilengkapi halaman luas dan suasana belajar kondusif.",
    specs: ["Ruang Kelas Sejuk", "Ventilasi Asri", "Proyektor Multimedia"],
    heightClass: "h-[340px] sm:h-[370px] md:h-[390px]",
    image: "/images/gedung-ma-margajaya.jpg"
  },
  {
    id: "masjid",
    title: "Masjid & Majelis Santri",
    subtitle: "Pusat Spiritualitas & Ibadah Harian",
    category: "Keagamaan",
    description: "Masjid pesantren sebagai pusat shalat berjamaah 5 waktu, qiyamul lail, dan pengajian kitab kuning bersama asatidz Darul Muawanah.",
    specs: ["Shalat 5 Waktu Berjamaah", "Kajian Kitab Kuning", "Majelis Ta'lim Rutin"],
    heightClass: "h-[440px] sm:h-[480px] md:h-[510px]",
    image: "/images/fasilitas-masjid.png"
  },
  {
    id: "masjid-utama",
    title: "Masjid Utama Darul Muawanah",
    subtitle: "Pusat Ibadah & Kajian Keagamaan",
    category: "Keagamaan",
    description: "Masjid utama kompleks Darul Muawanah yang masih terus dikembangkan, berfungsi sebagai pusat ibadah santri, kegiatan pondok, dan pengajian masyarakat sekitar Sukadana.",
    specs: ["Kapasitas Besar", "Mimbar Kajian", "Terbuka untuk Masyarakat"],
    heightClass: "h-[540px] sm:h-[600px] md:h-[640px]",
    image: "/images/fasilitas-halaman.png"
  },
  {
    id: "lab-komputer",
    title: "Laboratorium Komputer",
    subtitle: "Inovasi Teknologi & Literasi Digital",
    category: "Teknologi",
    description: "Fasilitas komputasi berkecepatan tinggi untuk ujian berbasis komputer (CBT/ANBK) dan pengembangan literasi digital santri.",
    specs: ["PC Modern", "Jaringan Fiber Optic", "Server ANBK Mandiri"],
    heightClass: "h-[380px] sm:h-[410px] md:h-[430px]",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&q=80"
  },
  {
    id: "perpustakaan",
    title: "Perpustakaan & Sumber Belajar",
    subtitle: "Jendela Ilmu & Turats Islam",
    category: "Literasi",
    description: "Koleksi ribuan buku kurikulum merdeka, kitab rujukan klasik pesantren, dan area baca tenang yang mendukung budaya literasi santri.",
    specs: ["Koleksi Buku Lengkap", "Kitab Kuning & Klasik", "Area Baca Nyaman"],
    heightClass: "h-[500px] sm:h-[560px] md:h-[590px]",
    image: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1200&q=80"
  },
  {
    id: "lapangan",
    title: "Lapangan Olahraga Terbuka",
    subtitle: "Kebugaran Fisik & Prestasi",
    category: "Olahraga",
    description: "Sarana olahraga serbaguna untuk futsal, voli, latihan panahan Al-Ramyi, dan baris-berbaris Paskibra santri MA Margajaya.",
    specs: ["Lapangan Voli & Futsal", "Area Panahan Outdoor", "Lapangan Upacara"],
    heightClass: "h-[350px] sm:h-[380px] md:h-[400px]",
    image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1200&q=80"
  },
  {
    id: "asrama",
    title: "Asrama Pondok Pesantren",
    subtitle: "Hunian Terpimpin Santri 24 Jam",
    category: "Pondok",
    description: "Lingkungan pondok santri terpisah putra & putri dengan bimbingan penuh asatidz pembina, menanamkan adab, disiplin, dan kemandirian.",
    specs: ["Kamar Bersih & Tertata", "Bimbingan 24 Jam", "Lingkungan Aman & Nyaman"],
    heightClass: "h-[480px] sm:h-[530px] md:h-[560px]",
    image: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=1200&q=80"
  },
  {
    id: "aula",
    title: "Aula Pertemuan Serbaguna",
    subtitle: "Panggung Unjuk Bakat & Kreativitas",
    category: "Pertemuan",
    description: "Pusat kegiatan akbar madrasah: seminar pendidikan, perayaan hari besar Islam, dan prosesi khidmat pelepasan wisuda santri.",
    specs: ["Panggung Representatif", "Kapasitas 400 Orang", "Sistem Tata Suara Prima"],
    heightClass: "h-[440px] sm:h-[490px] md:h-[520px]",
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&q=80"
  }
];
