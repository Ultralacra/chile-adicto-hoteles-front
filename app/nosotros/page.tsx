import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CategoryNav } from "@/components/category-nav";
import { HotelDetail } from "@/components/hotel-detail";

const nosotrosContent = [
  "En octubre de 2011, luego de llevar algunos años usando el hashtag #santiagoadicto para enfrentar a los muchos habitantes de nuestra capital que denostaban a su propia ciudad en Twitter usando el hashtag #santiasco, nuestro fundador, el periodista Rodrigo Guendelman, publicó una columna en el diario La Tercera con el título “Santiago Adicto”. Ese mismo día, el 29 de octubre, nacía la cuenta de Twitter @santiagoadicto y, algunas semanas después, la cuenta de Instagram @santiagoadicto. El objetivo era tan simple como contraintuitivo: que santiaguinos y santiaguinas conocieran, quisieran y cuidaran su ciudad.",
  "Cuatro años después, en noviembre de 2015, nace en Instagram @adictoachile, cuenta hermana de @santiagoadicto que buscaba generar ese mismo sentimiento en los habitantes de Chile.",
  "Casi 14 años más tarde, Santiago Adicto es una plataforma multimedia (programa de radio, espacio en televisión abierta y cable, columna en medios impresos y digitales), un medio de comunicación y una sólida comunidad con más de un millón de seguidores en redes sociales. Y, Adicto a Chile, una comunidad con más de 250 mil seguidores en Instagram y un nuevo proyecto que implica saltar desde las redes sociales a la web y al papel: la Guía Chile Adicto Hoteles. Fruto de la asociación de Guendelman con Patricio Miñano, director de destacadas publicaciones como Blank, Closer y Deck, y desde 2024 con el apoyo y sello de Imagen de Chile, esta publicación digital e impresa busca mostrar la diversidad, belleza, talento y visión que caracterizan a los mejores hoteles de Chile.",
  "Arquitectura, diseño, gastronomía, paisaje, sostenibilidad, conservación e innovación son solo algunos de los aspectos que esta guía ya está develando desde su primer número de 2023. Te invitamos a conocer Chile a través de estos embajadores y representantes de nuestra hospitalidad: los hoteles, refugios, lodges y estancias que atraviesan Chile de norte a sur.",
];

const nosotrosHotel = {
  name: "Quienes somos?",
  subtitle: "COMO COMENZÓ?",
  excerpt: nosotrosContent[0],
  fullContent: nosotrosContent.map((p) => `<p>${p}</p>`).join(""),
  featuredImage:
    "https://chileadictohoteles.cl/wp-content/uploads/2024/10/Portada-nosotros.webp",
  galleryImages: [],
  categories: ["nosotros"],
};

export default function NosotrosPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="mx-auto px-4 py-2 max-w-[1200px] hidden lg:block">
        <CategoryNav activeCategory="nosotros" compact />
      </div>
      <HotelDetail
        hotel={nosotrosHotel as any}
        hideUsefulInfo
        hideReservationIcon
      />
      <Footer activeCategory="nosotros" />
    </div>
  );
}
