export interface LeaderRole {
  name: string;
  role: string;
  subrole?: string;
  image?: string;
  badge?: string;
  bio?: string;
}

export interface Teacher {
  name: string;
  role: string;
  subject: string;
  category: 'PAI & Keagamaan' | 'Sains & Teknologi' | 'Bahasa & Literasi' | 'Sosial & Humaniora' | 'Vokasi & Konseling';
  education?: string;
  avatarBg?: string;
}

export const leadershipData = {
  principal: {
    name: "Anih Hidayatul Kamilah, M.Pd.",
    role: "Kepala Madrasah",
    subrole: "Penanggung Jawab Utama & Kebijakan Madrasah",
    image: "/images/kepala-madrasah.png",
    badge: "Pimpinan Utama",
    bio: "Memimpin MA Margajaya dalam integrasi kurikulum nasional dan penguatan kultur pesantren."
  },
  pesantren: {
    name: "KH. Pengasuh Ponpes Darul Muawanah",
    role: "Pengasuh & Dewan Pembina",
    subrole: "Kultur Kepesantrenan & Nilai Diniyah",
    badge: "Dewan Pembina"
  },
  komite: {
    name: "Dewan Komite MA Margajaya",
    role: "Komite Madrasah & Kemitraan",
    subrole: "Perwakilan Wali Santri & Tokoh Masyarakat",
    badge: "Sinergi Masyarakat"
  },
  tu: {
    name: "Kepala Tata Usaha & Staf",
    role: "Kepala Administrasi & TU",
    subrole: "Layanan Kesekretariatan & Kepegawaian",
    badge: "Administrasi"
  },
  deputies: [
    {
      name: "Waka Kurikulum",
      role: "Wakil Kepala Bidang Kurikulum",
      field: "Kurikulum Merdeka, Integrasi Sains & Kajian Kitab",
      color: "emerald",
      icon: "book"
    },
    {
      name: "Waka Kesiswaan",
      role: "Wakil Kepala Bidang Kesiswaan",
      field: "Pembinaan Akhlak, Kedisiplinan Santri, OSIS & Ekstrakurikuler",
      color: "gold",
      icon: "users"
    },
    {
      name: "Waka Sarana Prasarana",
      role: "Wakil Kepala Bidang Sarpras",
      field: "Fasilitas Belajar, Laboratorium & Tata Lingkungan Asri",
      color: "cyan",
      icon: "building"
    },
    {
      name: "Waka Humas & Kemitraan",
      role: "Wakil Kepala Bidang Humas",
      field: "Hubungan Kemenag, Pesantren Mitra, Alumni & Masyarakat",
      color: "emerald",
      icon: "share"
    }
  ]
};

export const teachersData: Teacher[] = [
  // PAI & Keagamaan
  {
    name: "HAMID BILLAH, S.Pd.I.",
    role: "Guru Fiqih & SKI",
    subject: "Fiqih & Sejarah Kebudayaan Islam",
    category: "PAI & Keagamaan",
    education: "S1 Pendidikan Agama Islam",
    avatarBg: "emerald"
  },
  {
    name: "ROHMAT HASANAH, M.Pd.",
    role: "Guru Al-Qur'an Hadis",
    subject: "Al-Qur'an Hadis & Ulumul Qur'an",
    category: "PAI & Keagamaan",
    education: "S2 Magister Pendidikan Islam",
    avatarBg: "gold"
  },
  {
    name: "SOPAN SOPARI, M.Pd.I.",
    role: "Guru Bahasa Arab & Hadis",
    subject: "Bahasa Arab & Al-Qur'an Hadis",
    category: "PAI & Keagamaan",
    education: "S2 Magister Pendidikan Islam",
    avatarBg: "emerald"
  },
  {
    name: "JAHRUDIN, S.Pd.I.",
    role: "Guru Ke-PUI-an",
    subject: "Ke-PUI-an & Kepesantrenan",
    category: "PAI & Keagamaan",
    education: "S1 Pendidikan Agama Islam",
    avatarBg: "cyan"
  },
  {
    name: "AJIDIN, S.Pd.I.",
    role: "Guru Tahsin & Tahfidz (TTQ)",
    subject: "Tahsin & Tahfidz Al-Qur'an (TTQ)",
    category: "PAI & Keagamaan",
    education: "S1 Pendidikan Agama Islam",
    avatarBg: "emerald"
  },

  // Bahasa & Literasi
  {
    name: "MAMAH MARYAMAH, S.Pd",
    role: "Guru Bahasa Indonesia & Sunda",
    subject: "Bahasa Indonesia & Basa Sunda",
    category: "Bahasa & Literasi",
    education: "S1 Pendidikan Bahasa & Sastra Indonesia",
    avatarBg: "gold"
  },
  {
    name: "EKA NURBAHARI, S.Pd.",
    role: "Guru Bahasa Inggris",
    subject: "Bahasa Inggris & Literasi Global",
    category: "Bahasa & Literasi",
    education: "S1 Pendidikan Bahasa Inggris",
    avatarBg: "cyan"
  },
  {
    name: "ATIK FARHAT KAMILAH, S.Pd.",
    role: "Guru Muatan Lokal & Budaya Sunda",
    subject: "Basa Sunda & Seni Budaya Daerah",
    category: "Bahasa & Literasi",
    education: "S1 Pendidikan Bahasa Daerah",
    avatarBg: "emerald"
  },

  // Sains & Teknologi
  {
    name: "WAHYUDIN, S.Pd",
    role: "Guru Matematika & Informatika",
    subject: "Matematika & Informatika (TIK)",
    category: "Sains & Teknologi",
    education: "S1 Pendidikan Matematika",
    avatarBg: "gold"
  },
  {
    name: "ELA NURLAELA, S.T, S.Pd.",
    role: "Guru IPA & Matematika",
    subject: "IPA Terpadu & Matematika",
    category: "Sains & Teknologi",
    education: "S1 Teknik & Pendidikan Sains",
    avatarBg: "emerald"
  },
  {
    name: "ELA NURLAELA",
    role: "Guru PJOK",
    subject: "Pendidikan Jasmani, Olahraga & Kesehatan (PJOK)",
    category: "Vokasi & Konseling",
    education: "Pendidikan Olahraga & Kebugaran",
    avatarBg: "gold"
  },

  // Sosial & Humaniora
  {
    name: "CHANDRA NURHIDAYAT, S.Pd.",
    role: "Guru Sosiologi & IPS",
    subject: "Sosiologi, IPS Terpadu & Akidah Akhlak",
    category: "Sosial & Humaniora",
    education: "S1 Pendidikan Sosiologi / IPS",
    avatarBg: "gold"
  },
  {
    name: "HAMDAN, S.Pd.",
    role: "Guru Akidah Akhlak & PPKn",
    subject: "Akidah Akhlak, Kewarganegaraan & Seni Budaya",
    category: "Sosial & Humaniora",
    education: "S1 Pendidikan Kewarganegaraan",
    avatarBg: "emerald"
  },
  {
    name: "ASEP MAULANA SIDIK, S.Pd.",
    role: "Guru Sejarah Indonesia",
    subject: "Sejarah Indonesia & Sejarah Peminatan",
    category: "Sosial & Humaniora",
    education: "S1 Pendidikan Sejarah",
    avatarBg: "cyan"
  },
  {
    name: "INEU YUNI ANDINI, S.Sos",
    role: "Guru Geografi & Riset Sosial",
    subject: "Geografi & Ilmu Sosial Terpadu",
    category: "Sosial & Humaniora",
    education: "S1 Sosiologi & Geografi",
    avatarBg: "gold"
  },
  {
    name: "SINCI YOANA, S.E.",
    role: "Guru Ekonomi & Akuntansi",
    subject: "Ekonomi, Akuntansi & Keuangan Syariah",
    category: "Sosial & Humaniora",
    education: "S1 Sarjana Ekonomi",
    avatarBg: "emerald"
  }
];
