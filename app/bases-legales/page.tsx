import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CategoryNav } from "@/components/category-nav";

export default function BasesLegalesPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="mx-auto px-4 py-2 max-w-[1200px] hidden lg:block">
        <CategoryNav activeCategory="bases-legales" compact />
      </div>

      <main className="site-inner py-8">
        <article className="prose prose-sm max-w-none font-neutra text-black">
          <h1 className="font-neutra-demi text-2xl text-center uppercase mb-2">
            BASES LEGALES DEL CONCURSO
          </h1>
          <p className="text-center font-neutra-demi text-lg mb-8">
            &ldquo;CHILE ADICTO HOTELES READERS CHOICE 2026&rdquo;
          </p>
          <p className="text-center text-sm mb-8">Concurso de votación popular y sorteo promocional</p>

          <section className="mb-6">
            <h2 className="font-neutra-demi text-lg uppercase mb-2">PRIMERO. ORGANIZACIÓN Y OBJETO DEL CONCURSO</h2>
            <p className="mb-2">
              &ldquo;Chile Adicto Hoteles&rdquo; (en adelante, indistintamente, el &ldquo;Organizador&rdquo; o &ldquo;Chile Adicto Hoteles&rdquo;) organiza el concurso denominado &ldquo;Premios Chile Adicto Hoteles Readers Choice 2026&rdquo; (en adelante, el &ldquo;Concurso&rdquo;), consistente en una votación popular abierta a los lectores del sitio web y canales digitales de Chile Adicto hoteles, mediante la cual el público podrá elegir a los hoteles de su preferencia dentro de las categorías establecidas en las presentes bases (en adelante, las &ldquo;Bases&rdquo;).
            </p>
            <p className="mb-2">
              El objeto del Concurso es doble: (i) determinar, mediante votación pública, los hoteles más votados por los lectores en cada una de las categorías señaladas en la cláusula Quinta; y (ii) sortear, entre todas las personas que hayan emitido al menos un voto válido durante el Período de Votación, un premio consistente en una estadía para cuatro (4) personas en un hotel de Chile, en los términos descritos en la cláusula Novena.
            </p>
            <p>La participación en el Concurso implica la aceptación plena, expresa e incondicional de las presentes Bases en todos sus términos.</p>
          </section>

          <section className="mb-6">
            <h2 className="font-neutra-demi text-lg uppercase mb-2">SEGUNDO. EMPRESA ORGANIZADORA</h2>
            <p>
              El Concurso es organizado por [COMPLETAR: razón social], sociedad del giro [COMPLETAR], Rol Único Tributario N&deg; [COMPLETAR], representada legalmente por [COMPLETAR: nombre del representante legal], ambos domiciliados en [COMPLETAR: domicilio], comuna de [COMPLETAR], Región [COMPLETAR], Chile.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="font-neutra-demi text-lg uppercase mb-2">TERCERO. ÁMBITO Y DURACIÓN</h2>
            <p className="mb-2">
              El período de votación (en adelante, el &ldquo;Período de Votación&rdquo;) tendrá una duración aproximada de tres (3) meses, comenzando el 8 de julio de 2026 y finalizando el 31 de octubre de 2026, a las 23:59 horas (hora continental de Chile), fecha en la que se cerrará de forma definitiva e irrevocable la plataforma de votación.
            </p>
            <p>
              El Concurso es de alcance nacional e internacional: podrán participar personas naturales domiciliadas en Chile o en el extranjero, conforme a lo dispuesto en la cláusula Cuarta.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="font-neutra-demi text-lg uppercase mb-2">CUARTO. PARTICIPANTES</h2>
            <p className="mb-2">
              4.1. Podrá participar en la votación toda persona natural, sin restricción de edad ni de nacionalidad o país de residencia, que se registre en la plataforma de votación indicando su nombre y una dirección de correo electrónico válida.
            </p>
            <p className="mb-2">
              4.2. En caso de que la persona ganadora del sorteo señalado en la cláusula Octava sea menor de 18 años, el premio deberá ser reclamado y percibido a través de su padre, madre o representante legal, quien deberá acreditar dicha calidad y suscribir la documentación que Chile Adicto Hoteles requiera para la entrega del premio.
            </p>
            <p className="mb-2">
              4.3. Quedan excluidos de participar en el sorteo (sin perjuicio de que puedan votar) los trabajadores, directores y ejecutivos de Chile Adicto Hoteles, de sus empresas relacionadas y de los hoteles participantes, así como sus respectivos cónyuges, convivientes civiles y parientes hasta el segundo grado de consanguinidad o afinidad.
            </p>
            <p>
              4.4. El registro de datos falsos, incompletos o de fantasía faculta a Chile Adicto Hoteles para anular la o las votaciones asociadas y, en su caso, excluir al participante del sorteo.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="font-neutra-demi text-lg uppercase mb-2">QUINTO. CATEGORÍAS Y HOTELES PARTICIPANTES</h2>
            <p className="mb-4">
              El Concurso contempla catorce (14) categorías de votación, agrupadas en nueve (9) zonas geográficas y tipos de hotel, según el siguiente detalle. Cada hotel participa únicamente en la categoría que se indica a continuación.
            </p>

            <h3 className="font-neutra-demi uppercase mb-1">1. Zona Norte</h3>
            <p className="font-neutra-demi mb-1">Categoría: Mejor Hotel 5 Corazones &ndash; Norte</p>
            <ul className="list-disc pl-6 mb-2">
              <li>Casa Molle Elqui</li>
              <li>Casa Molle La Puntilla</li>
              <li>Nayara Alto Atacama</li>
              <li>Cumbres Atacama</li>
              <li>Tierra Atacama</li>
              <li>Explora Atacama</li>
            </ul>
            <p className="font-neutra-demi mb-1">Categoría: Mejor Hotel 4 Corazones &ndash; Norte</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Our Habitas Atacama</li>
              <li>NOI Casa Atacama</li>
              <li>Desértica Atacama</li>
              <li>Vívelo Elqui</li>
            </ul>

            <h3 className="font-neutra-demi uppercase mb-1">2. Zona Sur</h3>
            <p className="font-neutra-demi mb-1">Categoría: Mejor Hotel 5 Corazones &ndash; Sur</p>
            <ul className="list-disc pl-6 mb-2">
              <li>AWA Puerto Varas</li>
              <li>Antumalal Pucón</li>
              <li>&amp;Beyond Vira Vira</li>
              <li>Park Lake Luxury</li>
              <li>Refugia Chiloé</li>
              <li>Loberías del Sur Carretera Austral</li>
              <li>Reserva Biológica Huilo Huilo</li>
              <li>Termas de Puyuhuapi</li>
              <li>Wyndham Puerto Varas</li>
            </ul>
            <p className="font-neutra-demi mb-1">Categoría: Mejor Hotel 4 Corazones &ndash; Sur</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Estancia Rilán Chiloé</li>
              <li>Rakau Lodge Pucón</li>
              <li>Ni Newen Lodge Pucón</li>
              <li>Puerta del Sol Valdivia</li>
              <li>Hotel Parque Quilquico</li>
              <li>El Remanso</li>
              <li>Cabo de Hornos</li>
              <li>Bellavista</li>
            </ul>

            <h3 className="font-neutra-demi uppercase mb-1">3. Torres del Paine &ndash; Puerto Natales</h3>
            <p className="font-neutra-demi mb-1">Categoría: Mejor Hotel 5 Corazones &ndash; Torres del Paine / Puerto Natales</p>
            <ul className="list-disc pl-6 mb-2">
              <li>Remota Patagonia Lodge</li>
              <li>Explora Torres del Paine</li>
              <li>The Singular Patagonia</li>
              <li>Río Serrano Hotel &amp; Spa</li>
              <li>Tierra Patagonia</li>
              <li>Las Torres Patagonia</li>
            </ul>
            <p className="font-neutra-demi mb-1">Categoría: Mejor Hotel 4 Corazones &ndash; Torres del Paine / Puerto Natales</p>
            <ul className="list-disc pl-6 mb-4">
              <li>NOI Índigo Patagonia</li>
              <li>Kau Río Serrano Patagonia</li>
              <li>Costa Australis Puerto Natales</li>
            </ul>

            <h3 className="font-neutra-demi uppercase mb-1">4. Zona Centro</h3>
            <p className="font-neutra-demi mb-1">Categoría: Mejor Hotel 5 Corazones &ndash; Centro</p>
            <ul className="list-disc pl-6 mb-2">
              <li>Las Majadas de Pirque</li>
              <li>NOI Puma Lodge</li>
              <li>Radisson Blu Acqua Concón</li>
              <li>Termas de Jahuel</li>
            </ul>
            <p className="font-neutra-demi mb-1">Categoría: Mejor Hotel 4 Corazones &ndash; Centro</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Taka Matanzas</li>
              <li>Casa Zapallar</li>
              <li>NOI Blend Colchagua</li>
              <li>Alaia Punta de Lobos</li>
              <li>La Leonera Hotel</li>
              <li>Pesebrera</li>
            </ul>

            <h3 className="font-neutra-demi uppercase mb-1">5. Santiago</h3>
            <p className="font-neutra-demi mb-1">Categoría: Mejor Hotel 5 Corazones &ndash; Santiago</p>
            <ul className="list-disc pl-6 mb-2">
              <li>NOI Vitacura</li>
              <li>The Singular Santiago</li>
              <li>Cumbres Santiago</li>
              <li>Hotel W Santiago</li>
              <li>Hotel AC Marriott Costanera</li>
              <li>Debaines Santiago</li>
              <li>Wyndham Pettra Santiago</li>
            </ul>
            <p className="font-neutra-demi mb-1">Categoría: Mejor Hotel 4 Corazones &ndash; Santiago</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Hotel Luciano K Santiago</li>
              <li>Hotel Castillo Rojo</li>
              <li>Hotel Alma Cruz</li>
              <li>Pueblo La Dehesa</li>
            </ul>

            <h3 className="font-neutra-demi uppercase mb-1">6. Isla de Pascua</h3>
            <p className="font-neutra-demi mb-1">Categoría: Mejor Hotel 5 Corazones &ndash; Isla de Pascua</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Explora Rapa Nui</li>
              <li>Nayara Hangaroa</li>
            </ul>

            <h3 className="font-neutra-demi uppercase mb-1">7. Joyas Únicas</h3>
            <p className="font-neutra-demi mb-1">Categoría: Mejor Joya Única de Chile</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Patagonia Camp</li>
              <li>Tawa</li>
              <li>Estancia Cerro Guido</li>
              <li>Altiplánico Rapa Nui</li>
              <li>Unai Atacama</li>
            </ul>

            <h3 className="font-neutra-demi uppercase mb-1">8. Hotel de Nieve</h3>
            <p className="font-neutra-demi mb-1">Categoría: Mejor Hotel de Nieve</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Termas de Chillán</li>
              <li>Corralco</li>
              <li>Portillo</li>
            </ul>

            <h3 className="font-neutra-demi uppercase mb-1">9. Hotel de Viña</h3>
            <p className="font-neutra-demi mb-1">Categoría: Mejor Hotel de Viña</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Matetic</li>
              <li>Vibo Wine</li>
              <li>Santa Cruz</li>
              <li>Bouchon</li>
              <li>Clos Apalta Residence</li>
              <li>Casa Real</li>
            </ul>

            <p className="mb-2">
              El listado de hoteles participantes fue definido por Chile Adicto Hoteles con anterioridad al inicio del Período de Votación y podrá ser modificado, si Chile Adicto Hoteles así lo estima, para un mejor orden de las categorías y subcategorías. A su vez, si Chile Adicto Hoteles considera que hay uno o más hoteles que debieran ser incluidos en alguna de las categorías, podrá agregarlos durante el Período de Votación, comunicando dicha modificación a través de sus canales oficiales.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="font-neutra-demi text-lg uppercase mb-2">SEXTO. MECÁNICA Y SISTEMA DE VOTACIÓN</h2>
            <p className="mb-2">
              6.1. La votación se realizará exclusivamente a través de la plataforma digital habilitada al efecto por Chile Adicto, disponible en www.chileadictohoteles.cl
            </p>
            <p className="mb-2">
              6.2. Para emitir un voto, el participante deberá completar únicamente dos campos: nombre y dirección de correo electrónico. No se requiere creación de contraseña ni verificación adicional.
            </p>
            <p className="mb-2">
              6.3. Un mismo participante podrá votar por más de un hotel y en más de una categoría, sin límite de votos totales, pudiendo emitir como máximo un (1) voto por cada hotel individualmente considerado. La Plataforma identificará al participante a través de la dirección de correo electrónico registrada e impedirá o invalidará automáticamente cualquier segundo voto emitido por la misma dirección de correo respecto de un mismo hotel.
            </p>
            <p className="mb-2">
              6.4. Ejemplo ilustrativo: un participante puede votar por el Hotel A (categoría Norte 5 estrellas) y por el Hotel B (categoría Santiago 4 estrellas), pero no podrá votar dos veces por el Hotel A.
            </p>
            <p className="mb-2">
              6.5. Todos los votos quedarán registrados y contabilizados en tiempo real por la Plataforma durante el Período de Votación.
            </p>
            <p className="mb-2">
              6.6. Chile Adicto Hoteles se reserva el derecho de auditar, invalidar o eliminar votos que presenten indicios de fraude, manipulación, duplicidad, uso de bots, scripts automatizados, direcciones de correo electrónico falsas, desechables o generadas en masa, o cualquier otra práctica que vulnere la libre y transparente participación de los lectores. La decisión de Chile Adicto Hoteles sobre la validez de un voto será inapelable.
            </p>
            <p>
              6.7. Dado que el sistema de identificación se basa únicamente en nombre y correo electrónico, Chile Adicto Hoteles no garantiza la imposibilidad absoluta de que una misma persona vote más de una vez por un mismo hotel utilizando distintas direcciones de correo electrónico; no obstante, aplicará los controles razonables descritos en esta cláusula para resguardar la integridad del proceso.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="font-neutra-demi text-lg uppercase mb-2">SÉPTIMO. DETERMINACIÓN DE LOS HOTELES GANADORES</h2>
            <p className="mb-2">
              7.1. Al cierre del Período de Votación, resultará ganador de cada categoría el hotel que haya obtenido el mayor número de votos válidos dentro de dicha categoría.
            </p>
            <p className="mb-2">
              7.2. En caso de empate entre dos o más hoteles en una misma categoría, se declarará a todos ellos como ganadores conjuntos (&ldquo;Readers&rsquo; Choice&rdquo;) de dicha categoría.
            </p>
            <p>
              7.3. Los resultados serán definitivos e inapelables, sin perjuicio del derecho de Chile Adicto Hoteles de corregir errores manifiestos de cómputo.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="font-neutra-demi text-lg uppercase mb-2">OCTAVO. SORTEO DEL PREMIO</h2>
            <p className="mb-2">
              8.1. Entre todas las personas que hayan registrado al menos un voto válido durante el Período de Votación, Chile Adicto realizará un sorteo aleatorio para determinar a la persona ganadora del premio descrito en la cláusula Novena (en adelante, el &ldquo;Sorteo&rdquo;).
            </p>
            <p className="mb-2">
              8.2. Cada participante tendrá derecho a una (1) sola oportunidad en el Sorteo, independientemente del número de votos válidos que haya emitido durante el Período de Votación.
            </p>
            <p className="mb-2">
              8.3. El Sorteo se realizará dentro de los cinco (5) días hábiles siguientes al cierre del Período de Votación (esto es, con posterioridad al 31 de octubre de 2026), mediante la plataforma random.org
            </p>
            <p className="mb-2">
              8.4. La persona ganadora será contactada dentro de los cinco (5) días hábiles siguientes al Sorteo, a través de la dirección de correo electrónico registrada en la Plataforma, y deberá confirmar la aceptación del premio dentro de los tres (3) días corridos siguientes al primer contacto. Si no responde dentro de dicho plazo, o si Chile Adicto Hoteles no logra contactarla, el premio se declarará caducado y se procederá a un nuevo sorteo entre los restantes participantes, bajo el mismo procedimiento.
            </p>
            <p>
              8.5. El nombre de la persona ganadora podrá ser publicado en el sitio web y canales oficiales de Chile Adicto Hoteles, salvo manifestación expresa en contrario comunicada por dicha persona dentro del plazo de aceptación del premio.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="font-neutra-demi text-lg uppercase mb-2">NOVENO. PREMIO</h2>
            <p className="mb-2">
              9.1. El premio consiste en una estadía para cuatro (4) personas, por 3 noches, con desayuno, almuerzo y cena incluidos, pero sin los bebestibles incluidos, en el Hotel que Chile Adicto hoteles defina, dentro de sus 75 socios participantes, sujeto a disponibilidad, y restricciones de fechas, y a las condiciones que informe oportunamente Chile Adicto Hoteles y/o el hotel patrocinador.
            </p>
            <p className="mb-2">
              9.2. El premio no incluye traslados, alimentación no especificada, actividades adicionales, seguros de viaje ni ningún otro gasto no mencionado expresamente, salvo que se indique lo contrario al momento de la entrega.
            </p>
            <p className="mb-2">
              9.3. El premio deberá utilizarse dentro del plazo que indique Chile Adicto Hoteles al momento de la entrega (10 meses desde la notificación al ganador), no siendo acumulable, canjeable por dinero en efectivo, transferible a terceros ni sustituible por otro producto o servicio.
            </p>
            <p className="mb-2">
              9.4. En caso de que la persona ganadora resida fuera de Chile, los costos y gestiones asociados a su traslado hasta el hotel (pasajes aéreos, visados, documentación de viaje, etc.) serán de su exclusivo cargo y responsabilidad.
            </p>
            <p>
              9.5. El premio está sujeto a las condiciones generales del hotel patrocinador (políticas de check-in / check-out, reglamento interno, disponibilidad de fechas y temporada, entre otras).
            </p>
          </section>

          <section className="mb-6">
            <h2 className="font-neutra-demi text-lg uppercase mb-2">DÉCIMO. PUBLICACIÓN DE RESULTADOS</h2>
            <p>
              Los hoteles ganadores de cada categoría, así como el nombre de la persona ganadora del Sorteo (salvo oposición expresa conforme a la cláusula 8.5), serán publicados en el sitio web de Chile Adicto Hoteles y en sus redes sociales oficiales, dentro de un plazo razonable posterior al cierre del Período de Votación y a la realización del Sorteo, respectivamente.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="font-neutra-demi text-lg uppercase mb-2">UNDÉCIMO. PROTECCIÓN DE DATOS PERSONALES</h2>
            <p className="mb-2">
              11.1. Los datos personales (nombre y correo electrónico) recabados a través de la Plataforma serán tratados por Chile Adicto de conformidad con la Ley N&deg; 19.628 sobre Protección de la Vida Privada, y con la Ley N&deg; 21.719, que crea la Agencia de Protección de Datos Personales y regula el tratamiento de datos personales, cuya entrada en vigencia está prevista para el 1 de diciembre de 2026.
            </p>
            <p className="mb-2">
              11.2. Los datos serán utilizados única y exclusivamente para: (i) gestionar la votación y controlar la duplicidad de votos por hotel; (ii) realizar el Sorteo y contactar a la persona ganadora; y (iii) informar a los participantes sobre los resultados del Concurso y futuras iniciativas de Chile Adicto, en este último caso siempre que el participante no haya manifestado su oposición.
            </p>
            <p className="mb-2">
              11.3. Los participantes podrán ejercer sus derechos de acceso, rectificación, cancelación y oposición (derechos ARCO) respecto de sus datos personales, escribiendo a closercl@gmail.com
            </p>
            <p>
              11.4. Chile Adicto Hoteles adoptará medidas razonables de seguridad para resguardar la confidencialidad de los datos personales recabados y no los cederá a terceros ajenos al Concurso, salvo al hotel patrocinador del premio, en la medida estrictamente necesaria para coordinar su entrega a la persona ganadora.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="font-neutra-demi text-lg uppercase mb-2">DUODÉCIMO. AUTORIZACIONES Y CUMPLIMIENTO NORMATIVO</h2>
            <p className="mb-2">
              12.1. El presente Concurso se enmarca dentro de las promociones comerciales reguladas, en lo que resulte aplicable, por el Decreto Ley N&deg; 1.298 de 1975 y sus normas complementarias, así como por las disposiciones sobre publicidad y protección de los derechos de los consumidores contenidas en la Ley N&deg; 19.496.
            </p>
            <p>
              12.2. Chile Adicto Hoteles gestionará, si correspondiere conforme a la normativa vigente y a la naturaleza del Sorteo, las autorizaciones o comunicaciones que deban efectuarse ante la Subsecretaría del Interior, la Delegación Presidencial respectiva, o el Servicio de Impuestos Internos, con la debida anticipación a la realización del Sorteo.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="font-neutra-demi text-lg uppercase mb-2">DÉCIMO TERCERO. LIMITACIÓN DE RESPONSABILIDAD</h2>
            <p className="mb-2">
              13.1. Chile Adicto Hoteles no será responsable por fallas técnicas, interrupciones, errores de conectividad o cualquier circunstancia ajena a su control razonable que impida a un participante votar o participar en el Sorteo.
            </p>
            <p className="mb-2">
              13.2. Chile Adicto no será responsable por la calidad del servicio prestado por los hoteles participantes ni por el hotel en que se haga efectivo el premio, siendo dicha responsabilidad exclusiva del respectivo prestador de servicios turísticos.
            </p>
            <p>
              13.3. Chile Adicto se reserva el derecho de excluir del Concurso, en cualquier momento, a quienes incumplan estas Bases o actúen de mala fe.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="font-neutra-demi text-lg uppercase mb-2">DÉCIMO CUARTO. ACEPTACIÓN DE LAS BASES</h2>
            <p>
              La participación en el Concurso implica el conocimiento y la aceptación íntegra de las presentes Bases, así como de las decisiones que adopte Chile Adicto Hoteles para la resolución de cualquier situación no prevista en ellas.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="font-neutra-demi text-lg uppercase mb-2">DÉCIMO QUINTO. MODIFICACIONES Y CASO FORTUITO O FUERZA MAYOR</h2>
            <p>
              Chile Adicto Hoteles podrá modificar las presentes Bases, o suspender o poner término anticipado al Concurso, en caso de fuerza mayor, caso fortuito, o por razones ajenas a su voluntad que dificulten o imposibiliten su normal desarrollo, informando oportunamente dicha circunstancia a través de sus canales oficiales.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="font-neutra-demi text-lg uppercase mb-2">DÉCIMO SEXTO. LEGISLACIÓN APLICABLE Y JURISDICCIÓN</h2>
            <p>
              Las presentes Bases se rigen por las leyes de la República de Chile. Cualquier controversia derivada de su interpretación o aplicación será sometida al conocimiento de los tribunales ordinarios de justicia de la ciudad de Santiago de Chile.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="font-neutra-demi text-lg uppercase mb-2">DÉCIMO SÉPTIMO. CONTACTO</h2>
            <p>
              Para consultas relacionadas con el Concurso, los participantes podrán escribir a closercl@gmail.com
            </p>
          </section>

          <p className="text-center font-neutra-demi mt-8">
            Santiago de Chile, julio de 2026.
          </p>
        </article>
      </main>

      <Footer activeCategory="bases-legales" />
    </div>
  );
}
