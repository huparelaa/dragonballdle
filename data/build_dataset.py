# -*- coding: utf-8 -*-
"""
Generador + verificador del dataset de personajes de DragonBallDle (v1).

- Construye data/personajes.json
- Valida taxonomias cerradas (valores permitidos)
- Verifica la REGLA DE UNICIDAD del README (seccion 4): no puede haber dos
  personajes con la combinacion exacta de todos los atributos comparables.
- Reporta cuasi-colisiones (pares que solo difieren en altura_cm), que el motor
  si puede distinguir (flecha) pero que son debiles como senal de juego.
"""
import json, os, sys, itertools
from collections import Counter, defaultdict

OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)))

# ---------------------------------------------------------------- taxonomias
RAZAS = ["Saiyan", "Humano", "Namekiano", "Androide", "Majin", "Raza de Freezer",
         "Deidad", "Ángel", "Demonio", "Otra especie", "Animal antropomorfo"]
GENEROS = ["masculino", "femenino"]
AFILIACIONES = ["Guerreros Z", "Escuela Tortuga", "Escuela de la Grulla",
                "Corporación Cápsula", "Deidades de la Tierra", "Kaios y Kaio-shins",
                "Dioses de la Destrucción", "Ángeles", "Clan Namekiano",
                "Ejército Saiyan", "Ejército de Freezer", "Fuerzas Especiales Ginyu",
                "Ejército del Listón Rojo", "Androides del Dr. Gero", "Familia Majin",
                "Tropas del Orgullo", "Equipo del Universo 6", "Sin afiliación"]
ROLES = ["protagonista", "antagonista", "secundario"]
# Binario a proposito. "revivido" existio hasta 2026-08-02 y se elimino: eran 29
# personajes contra 21 vivos, o sea que la mayoria de los que siguen en pie
# estan revividos y la casilla no descartaba casi nada. Quien murio y volvio
# queda "vivo", que es lo que es al final de su participacion. Ver taxonomias.md.
ESTADOS = ["vivo", "muerto"]
UNIVERSOS = ["Universo 6", "Universo 7", "Universo 10", "Universo 11", "Multiverso"]

DEBUTS = [
    ( 1, "Dragon Ball – Saga de las Esferas y el 21.º Torneo"),
    ( 2, "Dragon Ball – Saga del Listón Rojo y el 22.º Torneo"),
    ( 3, "Dragon Ball: La leyenda de Shenlong"),
    ( 4, "Dragon Ball: El castillo del demonio"),
    ( 5, "Dragon Ball – Saga de Piccolo Daimaō y el 23.º Torneo"),
    ( 6, "Dragon Ball: Aventura mística"),
    ( 7, "Dragon Ball Z – Saga de los Saiyajin"),
    ( 8, "Dragon Ball Z: Devuélveme a mi Gohan"),
    ( 9, "Dragon Ball Z – Saga de Namek y Freezer"),
    (10, "Dragon Ball Z: El hombre más fuerte del mundo"),
    (11, "Dragon Ball Z: El árbol del poder"),
    (12, "Dragon Ball Z: Bardock, el padre de Goku"),
    (13, "Dragon Ball Z: Los guerreros más poderosos"),
    (14, "Dragon Ball Z: La venganza de Cooler"),
    (15, "Dragon Ball Z – Saga de los Androides y Cell"),
    (16, "Dragon Ball Z: El regreso de Cooler"),
    (17, "Dragon Ball Z: Los súper androides"),
    (18, "Dragon Ball Z: La historia de Trunks"),
    (19, "Dragon Ball Z: Broly, el Super Saiyajin legendario"),
    (20, "Dragon Ball Z: Los guerreros de plata"),
    (21, "Dragon Ball Z – Saga de Majin Buu"),
    (22, "Dragon Ball Z: El regreso de Broly"),
    (23, "Dragon Ball Z: Bio-Broly"),
    (24, "Dragon Ball Z: La fusión de Goku y Vegeta"),
    (25, "Dragon Ball Z: El ataque del dragón"),
    (26, "Dragon Ball GT – Saga de Black Star"),
    (27, "Dragon Ball: El camino hacia el poder"),
    (28, "Dragon Ball GT – Saga de Baby"),
    (29, "Dragon Ball GT – Saga de Super 17"),
    (30, "Dragon Ball GT: 100 años después"),
    (31, "Dragon Ball GT – Saga de los Dragones Malignos"),
    (32, "Dragon Ball Z: La batalla de los dioses"),
    (33, "Dragon Ball Z: La resurrección de Freezer"),
    (34, "Dragon Ball Super – Saga de Batalla de los dioses"),
    (35, "Dragon Ball Super – Saga de la Resurrección de F"),
    (36, "Dragon Ball Super – Saga del Universo 6"),
    (37, "Dragon Ball Super – Saga de Trunks del Futuro"),
    (38, "Dragon Ball Super – Saga de la Supervivencia Universal"),
    (39, "Dragon Ball Super: Broly"),
    (40, "Dragon Ball Super: Super Hero"),
    (41, "Dragon Ball Daima"),
]
DEBUT_IDX = {n: i for i, n in DEBUTS}

API = "https://dragonball-api.com"

def P(id, nombre, alias, raza, genero, debut, afil, universo, transf, es_fusion,
      rol, altura, altura_fuente, estado, imagen=None, notas=None):
    return {
        "id": id, "nombre": nombre, "alias": alias,
        "raza": raza, "genero": genero,
        "debut": debut, "debut_indice": DEBUT_IDX[debut],
        "afiliacion_principal": afil, "universo": universo,
        "tiene_transformaciones": bool(transf), "transformaciones": transf or [],
        "es_fusion": es_fusion, "rol_narrativo": rol,
        "altura_cm": altura, "altura_fuente": altura_fuente,
        "estado": estado,
        "cita": None, "cita_idioma": None, "cita_estado": "pendiente",
        "imagen_base": imagen, "imagen_fuente": "dragonball-api.com" if imagen else "pendiente",
        "notas": notas,
    }

DB1  = "Dragon Ball – Saga de las Esferas y el 21.º Torneo"
DB2  = "Dragon Ball – Saga del Listón Rojo y el 22.º Torneo"
DB3  = "Dragon Ball – Saga de Piccolo Daimaō y el 23.º Torneo"
DBZ1 = "Dragon Ball Z – Saga de los Saiyajin"
DBZ2 = "Dragon Ball Z – Saga de Namek y Freezer"
DBZ3 = "Dragon Ball Z – Saga de los Androides y Cell"
DBZ4 = "Dragon Ball Z – Saga de Majin Buu"
GT2  = "Dragon Ball GT – Saga de Baby"
DBS3 = "Dragon Ball Super – Saga del Universo 6"
DBS4 = "Dragon Ball Super – Saga de Trunks del Futuro"
DBS5 = "Dragon Ball Super – Saga de la Supervivencia Universal"
U7, U6, U10, U11, MV = "Universo 7", "Universo 6", "Universo 10", "Universo 11", "Multiverso"
CANON, EST = "canonica", "estimada"

R = []  # roster

# ---- Nucleo protagonico -----------------------------------------------------
R.append(P("goku", "Goku", ["Son Goku", "Kakarot", "Kakarotto", "Goku Son"],
    ["Saiyan"], "masculino", DB1, ["Guerreros Z", "Escuela Tortuga"], U7,
    ["Gran Simio", "Kaio-Ken", "Super Saiyajin", "Super Saiyajin 2", "Super Saiyajin 3",
     "Super Saiyajin 4", "Super Saiyajin God", "Super Saiyajin Blue", "Ultra Instinto"],
    False, "protagonista", 175, CANON, "vivo", API + "/characters/goku_normal.webp"))

R.append(P("vegeta", "Vegeta", ["Príncipe Vegeta", "Vegeta IV", "Majin Vegeta"],
    ["Saiyan"], "masculino", DBZ1, ["Guerreros Z", "Ejército Saiyan", "Ejército de Freezer"], U7,
    ["Gran Simio", "Super Saiyajin", "Super Saiyajin 2", "Majin Vegeta", "Super Saiyajin 4",
     "Super Saiyajin God", "Super Saiyajin Blue", "Super Saiyajin Blue Evolución", "Ultra Ego"],
    False, "protagonista", 164, CANON, "vivo", API + "/characters/vegeta_normal.webp"))

R.append(P("gohan", "Gohan", ["Son Gohan", "Gran Saiyaman", "Son Gohanda"],
    ["Saiyan", "Humano"], "masculino", DBZ1, ["Guerreros Z"], U7,
    ["Gran Simio", "Super Saiyajin", "Super Saiyajin 2", "Gohan Definitivo (Místico)", "Gohan Beast"],
    False, "protagonista", 176, CANON, "vivo", API + "/characters/gohan.webp"))

R.append(P("piccolo", "Piccolo", ["Piccolo Jr.", "Picoro", "Piccoro", "Namekiano"],
    ["Namekiano"], "masculino", DB3, ["Guerreros Z"], U7,
    ["Súper Namekiano", "Gigantificación", "Piccolo Naranja"],
    False, "protagonista", 226, CANON, "vivo", API + "/characters/picolo_normal.webp"))

R.append(P("trunks-futuro", "Trunks del Futuro", ["Mirai Trunks", "Trunks futuro", "Trunks adulto"],
    ["Saiyan", "Humano"], "masculino", DBZ3, ["Guerreros Z", "Corporación Cápsula"], U7,
    ["Super Saiyajin", "Super Saiyajin 2", "Super Saiyajin Ira"],  # noqa
    False, "protagonista", 170, CANON, "vivo", None,
    "Línea temporal alterna; estado tomado al final de su participación en Super."))

# ---- Guerreros Z y soporte --------------------------------------------------
R.append(P("krilin", "Krilin", ["Krillin", "Kuririn", "Krilin Chestnut", "Cuatro Ojos"],
    ["Humano"], "masculino", DB1, ["Guerreros Z", "Escuela Tortuga"], U7,
    None, False, "secundario", 153, CANON, "vivo", API + "/characters/Krilin_Universo7.webp"))

R.append(P("bulma", "Bulma", ["Bulma Brief", "Bulma Briefs"],
    ["Humano"], "femenino", DB1, ["Guerreros Z", "Corporación Cápsula"], U7,
    None, False, "secundario", 165, CANON, "vivo", API + "/characters/bulma.webp"))

R.append(P("ten-shin-han", "Ten Shin Han", ["Tenshinhan", "Tien Shinhan", "Ten", "Tien"],
    ["Humano"], "masculino", DB2, ["Guerreros Z", "Escuela de la Grulla"], U7,
    None, False, "secundario", 187, CANON, "vivo", API + "/characters/Tenshinhan_Universo7.webp"))

R.append(P("chaoz", "Chaoz", ["Chiaotzu", "Chao Zu", "Chaos", "Chaozu"],
    ["Humano"], "masculino", DB2, ["Guerreros Z", "Escuela de la Grulla"], U7,
    None, False, "secundario", 138, CANON, "vivo"))

R.append(P("yamcha", "Yamcha", ["Yamsha", "Yamucha", "Bandido del desierto"],
    ["Humano"], "masculino", DB1, ["Guerreros Z", "Escuela Tortuga"], U7,
    None, False, "secundario", 183, CANON, "vivo", API + "/characters/Final_Yamcha.webp"))

R.append(P("muten-roshi", "Muten Roshi", ["Maestro Roshi", "Master Roshi", "Kame Sennin", "Tortuga Genial", "Muten Roshy"],
    ["Humano"], "masculino", DB1, ["Escuela Tortuga"], U7,
    ["Máximo Poder (musculoso)"], False, "secundario", 165, CANON, "vivo",
    API + "/characters/roshi.webp"))

R.append(P("chichi", "Chi-Chi", ["Chichi", "Milk"],
    ["Humano"], "femenino", DB1, ["Guerreros Z"], U7,
    None, False, "secundario", 163, CANON, "vivo", API + "/characters/ChiChi_DBS.webp"))

R.append(P("goten", "Goten", ["Son Goten"],
    ["Saiyan", "Humano"], "masculino", DBZ4, ["Guerreros Z"], U7,
    ["Super Saiyajin"], False, "secundario", 123, CANON, "vivo", None,
    "Altura canónica corresponde a su forma infantil (Super Exciting Guide)."))

R.append(P("trunks", "Trunks", ["Trunks nino", "Trunks Brief", "Chibi Trunks"],
    ["Saiyan", "Humano"], "masculino", DBZ4, ["Guerreros Z", "Corporación Cápsula"], U7,
    ["Super Saiyajin"], False, "secundario", 129, CANON, "vivo", API + "/characters/Trunks_Buu_Artwork.webp",
    "Altura canónica corresponde a su forma infantil (Super Exciting Guide)."))

R.append(P("videl", "Videl", ["Videl Satan", "Gran Saiyaman 2"],
    ["Humano"], "femenino", DBZ4, ["Guerreros Z"], U7,
    None, False, "secundario", 157, CANON, "vivo"))

R.append(P("pan", "Pan", ["Pan Son"],
    ["Saiyan", "Humano"], "femenino", DBZ4, ["Guerreros Z"], U7,
    None, False, "secundario", 125, EST, "vivo"))

R.append(P("mr-satan", "Mr. Satan", ["Mister Satan", "Hercule", "Satan", "Campeón del mundo"],
    ["Humano"], "masculino", DBZ3, ["Sin afiliación"], U7,
    None, False, "secundario", 188, CANON, "vivo", API + "/characters/Mr_Satan_DBSuper.webp",
    "No murió en la destrucción de la Tierra: fue teletransportado al Planeta Sagrado."))

R.append(P("androide-18", "Androide 18", ["A18", "C-18", "Numero 18", "Lazuli", "Android 18"],
    ["Humano", "Androide"], "femenino", DBZ3, ["Guerreros Z", "Androides del Dr. Gero", "Ejército del Listón Rojo"], U7,
    None, False, "secundario", 168, EST, "vivo", API + "/characters/Androide_18_Artwork.webp"))

R.append(P("androide-17", "Androide 17", ["A17", "C-17", "Numero 17", "Lapis", "Android 17"],
    ["Humano", "Androide"], "masculino", DBZ3, ["Androides del Dr. Gero", "Ejército del Listón Rojo"], U7,
    None, False, "secundario", 170, EST, "vivo", API + "/characters/17_Artwork.webp"))

R.append(P("androide-16", "Androide 16", ["A16", "C-16", "Numero 16", "Android 16"],
    ["Androide"], "masculino", DBZ3, ["Androides del Dr. Gero", "Ejército del Listón Rojo"], U7,
    None, False, "secundario", 250, EST, "muerto", API + "/characters/Androide_16.webp"))

R.append(P("dende", "Dende", ["Dios Dende", "Kami Dende"],
    ["Namekiano"], "masculino", DBZ2, ["Deidades de la Tierra", "Clan Namekiano"], U7,
    None, False, "secundario", 130, EST, "vivo", API + "/characters/Dende_Artwork.webp"))

R.append(P("kami", "Kami", ["Kamisama", "Dios", "Dios de la Tierra", "Kami-sama"],
    ["Namekiano"], "masculino", DB3, ["Deidades de la Tierra", "Clan Namekiano"], U7,
    None, False, "secundario", 223, CANON, "vivo", None,
    "Regla de fusión: la fusión permanente con Piccolo no cuenta como muerte."))

R.append(P("korin", "Korin", ["Karin", "Maestro Korin", "Korin el gato"],
    ["Animal antropomorfo"], "masculino", DB2, ["Deidades de la Tierra"], U7,
    None, False, "secundario", 80, EST, "vivo"))

R.append(P("yajirobe", "Yajirobe", ["Yajirobei", "Yayirobe"],
    ["Humano"], "masculino", DB3, ["Guerreros Z"], U7,
    None, False, "secundario", 165, CANON, "vivo"))

R.append(P("oolong", "Oolong", ["Olong", "Ulong", "Puerco Oolong"],
    ["Animal antropomorfo"], "masculino", DB1, ["Sin afiliación"], U7,
    None, False, "secundario", 121, CANON, "vivo"))

R.append(P("puar", "Puar", ["Pu'ar", "Puarh", "Pual"],
    ["Animal antropomorfo"], "masculino", DB1, ["Sin afiliación"], U7,
    None, False, "secundario", 40, EST, "vivo"))

R.append(P("launch", "Launch", ["Lunch", "Lanch"],
    ["Humano"], "femenino", DB1, ["Escuela Tortuga"], U7,
    ["Launch de pelo azul (dulce)", "Launch rubia (agresiva)"], False, "secundario", 168, EST, "vivo",
    API + "/characters/Lunch_traje_de_sirvienta_en_el_manga.webp",
    "Estado tomado al final de su participación (Dragon Ball / inicio de Z)."))

R.append(P("bardock", "Bardock", ["Bardoc", "Baddack", "padre de Goku"],
    ["Saiyan"], "masculino", DBZ1, ["Ejército Saiyan", "Ejército de Freezer"], U7,
    ["Gran Simio"], False, "secundario", 175, EST, "muerto", API + "/characters/Bardock_Artwork.webp",
    "Su Super Saiyajin proviene de Episode of Bardock, fuera del alcance canon de la v1."))

R.append(P("uub", "Uub", ["Oob", "Ub", "Majuub", "Uubu"],
    ["Humano"], "masculino", DBZ4, ["Guerreros Z"], U7,
    ["Majuub"], False, "secundario", 175, EST, "vivo", None,
    "Altura corresponde a su forma adulta de GT (estimada)."))

R.append(P("kaio-del-norte", "Kaio del Norte", ["Kaito", "Kaio Sama", "King Kai", "Kaiosama"],
    ["Deidad"], "masculino", DBZ1, ["Kaios y Kaio-shins"], U7,
    None, False, "secundario", 140, EST, "muerto", API + "/characters/Kaio_del_Norte.webp",
    "Muere en la autodestrucción de Cell; aparece con aureola posteriormente."))

R.append(P("kaioshin-este", "Kaio-shin del Este", ["Shin", "Supremo Kaio-sama", "Kaioshin", "Supreme Kai"],
    ["Deidad"], "masculino", DBZ4, ["Kaios y Kaio-shins"], U7,
    None, False, "secundario", 150, EST, "vivo", API + "/characters/Kaio-shin_del_este_Artwork.webp"))

R.append(P("nail", "Nail", ["Neil", "Nairu"],
    ["Namekiano"], "masculino", DBZ2, ["Clan Namekiano"], U7,
    None, False, "secundario", 200, EST, "vivo", API + "/characters/Nail_Artwork.webp",
    "Regla de fusión: la fusión permanente con Piccolo no cuenta como muerte."))

# ---- Fusiones --------------------------------------------------------------
R.append(P("gotenks", "Gotenks", ["Gotrunks", "Gotenkusu"],
    ["Saiyan", "Humano"], "masculino", DBZ4, ["Guerreros Z"], U7,
    ["Super Saiyajin", "Super Saiyajin 3"], True, "secundario", 130, EST, "vivo",
    API + "/characters/Gotenks_Artwork.webp"))

R.append(P("vegetto", "Vegetto", ["Vegito", "Vegerot", "Vegeto"],
    ["Saiyan"], "masculino", DBZ4, ["Guerreros Z"], U7,
    ["Super Saiyajin", "Super Saiyajin Blue"], True, "protagonista", 175, EST, "vivo",
    API + "/transformaciones/Vegetto.webp"))

R.append(P("gogeta", "Gogeta", ["Gogueta", "Gogetto"],
    ["Saiyan"], "masculino", "Dragon Ball Z: La fusión de Goku y Vegeta",
    ["Guerreros Z"], U7,
    ["Super Saiyajin", "Super Saiyajin 4", "Super Saiyajin Blue", "Super Saiyajin Blue Evolución"],
    True, "protagonista", 175, EST, "vivo", API + "/transformaciones/gogeta.webp"))

R.append(P("kefla", "Kefla", ["Kefura", "Caulifla y Kale"],
    ["Saiyan"], "femenino", DBS5, ["Equipo del Universo 6"], U6,
    ["Super Saiyajin", "Super Saiyajin 2"], True, "antagonista", 170, EST, "vivo"))

# ---- Villanos Dragon Ball clasico ------------------------------------------
R.append(P("rey-piccolo", "Rey Piccolo", ["Piccolo Daimao", "Piccolo Daimaku", "Gran Demonio Piccolo", "King Piccolo"],
    ["Namekiano"], "masculino", DB3, ["Sin afiliación"], U7,
    ["Forma rejuvenecida"], False, "antagonista", 250, CANON, "muerto"))

R.append(P("tao-pai-pai", "Tao Pai Pai", ["Taopaipai", "Mercenary Tao", "General Tao"],
    ["Humano", "Androide"], "masculino", DB2, ["Escuela de la Grulla", "Ejército del Listón Rojo"], U7,
    ["Cyborg Tao"], False, "antagonista", 178, CANON, "vivo"))

# ---- Villanos Dragon Ball Z ------------------------------------------------
R.append(P("raditz", "Raditz", ["Radix", "Raditsu", "hermano de Goku"],
    ["Saiyan"], "masculino", DBZ1, ["Ejército Saiyan", "Ejército de Freezer"], U7,
    None, False, "antagonista", 200, EST, "muerto", API + "/characters/Raditz_artwork_Dokkan.webp"))

R.append(P("nappa", "Nappa", ["Nappa el Saiyan"],
    ["Saiyan"], "masculino", DBZ1, ["Ejército Saiyan", "Ejército de Freezer"], U7,
    None, False, "antagonista", 210, EST, "muerto"))

R.append(P("freezer", "Freezer", ["Frieza", "Freeza", "Lord Freezer", "Freezer Sama", "Golden Freezer"],
    ["Raza de Freezer"], "masculino", DBZ2, ["Ejército de Freezer"], U7,
    ["Primera forma", "Segunda forma", "Tercera forma", "Forma final", "Forma final al 100%",
     "Golden Freezer", "Black Freezer"],
    False, "antagonista", 158, CANON, "vivo", API + "/characters/Freezer.webp",
    "Altura canónica corresponde a su forma final (Daizenshuu)."))

R.append(P("zarbon", "Zarbon", ["Zaabon"],
    ["Otra especie"], "masculino", DBZ2, ["Ejército de Freezer"], U7,
    ["Forma monstruo"], False, "antagonista", 190, EST, "muerto", API + "/characters/zarbon.webp"))

R.append(P("dodoria", "Dodoria", ["Dodoriah"],
    ["Otra especie"], "masculino", DBZ2, ["Ejército de Freezer"], U7,
    None, False, "antagonista", 195, EST, "muerto", API + "/characters/dodoria.webp"))

R.append(P("ginyu", "Capitán Ginyu", ["Ginyu", "Ginew", "Capitán Ginew"],
    ["Otra especie"], "masculino", DBZ2, ["Ejército de Freezer", "Fuerzas Especiales Ginyu"], U7,
    None, False, "antagonista", 210, EST, "muerto", API + "/characters/ginyu.webp"))

R.append(P("rey-cold", "Rey Cold", ["King Cold", "Rey Kold", "padre de Freezer"],
    ["Raza de Freezer"], "masculino", DBZ3, ["Ejército de Freezer"], U7,
    None, False, "antagonista", 250, EST, "muerto"))

R.append(P("cell", "Cell", ["Celula", "Celda", "Cell Perfecto", "Bioandroide"],
    ["Androide"], "masculino", DBZ3, ["Androides del Dr. Gero"], U7,
    ["Forma imperfecta", "Forma semiperfecta", "Forma perfecta", "Cell Súper Perfecto"],
    False, "antagonista", 213, CANON, "muerto", API + "/characters/celula.webp",
    "Altura canónica corresponde a su forma perfecta (Daizenshuu)."))

R.append(P("androide-19", "Androide 19", ["A19", "C-19", "Numero 19", "Android 19"],
    ["Androide"], "masculino", DBZ3, ["Androides del Dr. Gero", "Ejército del Listón Rojo"], U7,
    None, False, "antagonista", 155, EST, "muerto", API + "/characters/Android19.webp"))

R.append(P("dr-gero", "Dr. Gero", ["Doctor Gero", "Androide 20", "A20", "C-20", "Doctor Maki Gero"],
    ["Humano", "Androide"], "masculino", DBZ3, ["Androides del Dr. Gero", "Ejército del Listón Rojo"], U7,
    None, False, "antagonista", 165, EST, "muerto", API + "/characters/Dr._Gero nadroide 20.webp"))

R.append(P("majin-buu", "Majin Buu", ["Boo", "Majin Boo", "Buu Gordo", "Kid Buu", "Buu Puro", "Súper Buu", "Mr. Buu"],
    ["Majin"], "masculino", DBZ4, ["Familia Majin"], U7,
    ["Majin Buu (Gordo)", "Súper Buu", "Súper Buu (Gotenks absorbido)",
     "Súper Buu (Gohan absorbido)", "Kid Buu (Buu Puro)"],
    False, "antagonista", 200, EST, "muerto", API + "/characters/BuuGordo_Universo7.webp",
    "Entrada única por identidad; su mitad buena (Mr. Buu) sigue viva y se trata como forma."))

R.append(P("babidi", "Babidi", ["Bobidi", "Babidee", "Babidy"],
    ["Majin"], "masculino", DBZ4, ["Familia Majin"], U7,
    None, False, "antagonista", 100, EST, "muerto", API + "/characters/Babidi_Artwork.webp"))

R.append(P("dabura", "Dabura", ["Darbura", "Dabra", "Rey del Mundo Oscuro"],
    ["Demonio"], "masculino", DBZ4, ["Familia Majin"], U7,
    None, False, "antagonista", 200, EST, "muerto"))

# ---- Peliculas -------------------------------------------------------------
R.append(P("garlic-jr", "Garlic Jr.", ["Garlick Jr.", "Garlic Junior"],
    ["Demonio"], "masculino", "Dragon Ball Z: Devuélveme a mi Gohan", ["Sin afiliación"], U7,
    ["Forma Súper"], False, "antagonista", 120, EST, "vivo", None,
    "Encerrado para siempre en la Zona Muerta: sigue vivo al final de su participación."))

R.append(P("turles", "Turles", ["Tullece", "Taress", "Tarble no", "Turlex"],
    ["Saiyan"], "masculino", "Dragon Ball Z: El árbol del poder", ["Sin afiliación"], U7,
    None, False, "antagonista", 175, EST, "muerto"))

R.append(P("lord-slug", "Lord Slug", ["Slug", "Namekiano Slug", "Sulug"],
    ["Namekiano"], "masculino", "Dragon Ball Z: Los guerreros más poderosos", ["Sin afiliación"], U7,
    ["Súper Namekiano", "Gigantificación"], False, "antagonista", 235, EST, "muerto"))

R.append(P("cooler", "Cooler", ["Kuula", "Coola", "hermano de Freezer", "Metal Cooler"],
    ["Raza de Freezer"], "masculino", "Dragon Ball Z: La venganza de Cooler",
    ["Ejército de Freezer"], U7,
    ["Forma final (quinta forma)", "Meta-Cooler"], False, "antagonista", 175, EST, "muerto"))

R.append(P("androide-13", "Androide 13", ["A13", "C-13", "Numero 13", "Android 13"],
    ["Androide"], "masculino", "Dragon Ball Z: Los súper androides",
    ["Androides del Dr. Gero", "Ejército del Listón Rojo"], U7,
    ["Androide 13 fusionado"], False, "antagonista", 205, EST, "muerto",
    API + "/characters/Androide13normal.webp"))

R.append(P("broly-legendario", "Broly (Legendario)",
    ["Brolly", "Broli", "Super Saiyajin Legendario", "Broly de Z", "Broly DBZ"],
    ["Saiyan"], "masculino", "Dragon Ball Z: Broly, el Super Saiyajin legendario",
    ["Sin afiliación"], U7,
    ["Super Saiyajin", "Super Saiyajin Legendario"],
    False, "antagonista", 230, CANON, "muerto", None,
    "Broly de 1993, de dimensión alterna. Personaje distinto del de 2018 (README §7)."))

R.append(P("broly-super", "Broly (Super)",
    ["Broly de Super", "Broly DBS", "Broly canon"],
    ["Saiyan"], "masculino", "Dragon Ball Super: Broly",
    ["Ejército de Freezer"], U7,
    ["Super Saiyajin", "Super Saiyajin (Ira)", "Super Saiyajin Legendario"],
    False, "antagonista", 230, EST, "vivo", API + "/transformaciones/Broly_DBS_Base.webp",
    "Broly de 2018, versión de Toriyama, continuidad principal (README §7)."))

R.append(P("bojack", "Bojack", ["Bojak", "Bojaku"],
    ["Otra especie"], "masculino", "Dragon Ball Z: Los guerreros de plata", ["Sin afiliación"], U7,
    ["Forma Full Power"], False, "antagonista", 200, EST, "muerto"))

R.append(P("janemba", "Janemba", ["Yanemba", "Super Janemba"],
    ["Demonio"], "masculino", "Dragon Ball Z: La fusión de Goku y Vegeta", ["Sin afiliación"], U7,
    ["Super Janemba"], False, "antagonista", 230, EST, "muerto",
    API + "/transformaciones/Janemba_artwork_SDBH.webp"))

R.append(P("tapion", "Tapion", ["Tapion de Konats"],
    ["Otra especie"], "masculino", "Dragon Ball Z: El ataque del dragón", ["Sin afiliación"], U7,
    None, False, "secundario", 165, EST, "vivo"))

# ---- Dragon Ball Super -----------------------------------------------------
R.append(P("beerus", "Beerus", ["Bills", "Bers", "Dios de la Destrucción Beerus", "Beers"],
    ["Deidad"], "masculino", "Dragon Ball Z: La batalla de los dioses",
    ["Dioses de la Destrucción"], U7,
    None, False, "secundario", 195, EST, "vivo", API + "/characters/Beerus_DBS_Broly_Artwork.webp"))

R.append(P("whis", "Whis", ["Wiss", "Whiss", "ángel Whis"],
    ["Ángel"], "masculino", "Dragon Ball Z: La batalla de los dioses", ["Ángeles"], U7,
    None, False, "secundario", 220, EST, "vivo", API + "/characters/Whis_DBS_Broly_Artwork.webp"))

R.append(P("champa", "Champa", ["Champa Sama", "Dios de la Destrucción Champa"],
    ["Deidad"], "masculino", DBS3, ["Dioses de la Destrucción"], U6,
    None, False, "secundario", 165, EST, "vivo"))

R.append(P("vados", "Vados", ["Bados", "ángel Vados"],
    ["Ángel"], "femenino", DBS3, ["Ángeles"], U6,
    None, False, "secundario", 220, EST, "vivo"))

R.append(P("frost", "Frost", ["Furosuto", "Freezer del Universo 6"],
    ["Raza de Freezer"], "masculino", DBS3, ["Equipo del Universo 6"], U6,
    ["Segunda forma", "Forma final", "Forma de asalto"], False, "antagonista", 158, EST, "vivo"))

R.append(P("hit", "Hit", ["Hitto", "Hit el asesino"],
    ["Otra especie"], "masculino", DBS3, ["Equipo del Universo 6"], U6,
    None, False, "antagonista", 193, CANON, "vivo"))

R.append(P("cabba", "Cabba", ["Kyabe", "Caba", "Cabe"],
    ["Saiyan"], "masculino", DBS3, ["Equipo del Universo 6"], U6,
    ["Super Saiyajin", "Super Saiyajin 2"], False, "secundario", 165, EST, "vivo"))

R.append(P("caulifla", "Caulifla", ["Kyabetsu", "Colifla", "Caulifa"],
    ["Saiyan"], "femenino", DBS5, ["Equipo del Universo 6"], U6,
    ["Super Saiyajin", "Super Saiyajin 2"], False, "antagonista", 160, EST, "vivo"))

R.append(P("kale", "Kale", ["Keru", "Kale Berserker"],
    ["Saiyan"], "femenino", DBS5, ["Equipo del Universo 6"], U6,
    ["Super Saiyajin Berserker", "Super Saiyajin 2 (controlada)"], False, "antagonista", 165, EST, "vivo"))

R.append(P("zamasu", "Zamasu", ["Zamas", "Zamasu Fusionado", "Zamasu Inmortal"],
    ["Deidad"], "masculino", DBS4, ["Kaios y Kaio-shins"], U10,
    ["Zamasu Inmortal", "Zamasu Fusionado"], False, "antagonista", 180, EST, "muerto"))

R.append(P("goku-black", "Goku Black", ["Black", "Black Goku", "Super Saiyajin Rosé"],
    ["Saiyan", "Deidad"], "masculino", DBS4, ["Kaios y Kaio-shins"], U10,
    ["Super Saiyajin Rosé"], False, "antagonista", 175, EST, "muerto", None,
    "Zamasu del Universo 10 en el cuerpo del Goku del Universo 7 (ver README §7)."))

R.append(P("jiren", "Jiren", ["Jiren el Gris", "Jiren Full Power"],
    ["Otra especie"], "masculino", DBS5, ["Tropas del Orgullo"], U11,
    None, False, "antagonista", 185, EST, "vivo", API + "/characters/Jiren.webp"))

R.append(P("toppo", "Toppo", ["Top", "Toppo el Justiciero"],
    ["Otra especie"], "masculino", DBS5, ["Tropas del Orgullo"], U11,
    ["Dios de la Destrucción"], False, "antagonista", 210, EST, "vivo", API + "/characters/Toppo.webp"))

R.append(P("zeno", "Zeno", ["Zen-Oh", "Zeno Sama", "Rey de Todo", "Todito", "Zen Oo"],
    ["Deidad"], "masculino", DBS3, ["Sin afiliación"], MV,
    None, False, "secundario", 60, EST, "vivo", API + "/characters/Zeno_Artwork.webp"))

# ---- Dragon Ball GT --------------------------------------------------------
R.append(P("baby", "Baby", ["Bebi", "Baby Vegeta", "Bebi Vegeta"],
    ["Otra especie"], "masculino", GT2, ["Sin afiliación"], U7,
    ["Baby Vegeta", "Súper Baby 1", "Súper Baby 2", "Gran Simio Dorado"],
    False, "antagonista", 164, EST, "muerto", None,
    "Altura corresponde al cuerpo de Vegeta, su huésped principal."))

# =============================================================== VALIDACION
errors, warnings = [], []

def chk(cond, msg, bucket=errors):
    if not cond:
        bucket.append(msg)

ids = [c["id"] for c in R]
chk(len(ids) == len(set(ids)), "IDs duplicados: %s" % [k for k, v in Counter(ids).items() if v > 1])
nombres = [c["nombre"] for c in R]
chk(len(nombres) == len(set(nombres)), "Nombres duplicados")

# colision de alias entre personajes (romperia el autocompletado)
alias_map = defaultdict(list)
for c in R:
    for a in set(x.lower() for x in [c["nombre"]] + c["alias"]):
        alias_map[a].append(c["id"])
for a, owners in alias_map.items():
    if len(owners) > 1:
        warnings.append("Alias ambiguo entre personajes: '%s' -> %s" % (a, owners))

for c in R:
    for r in c["raza"]:
        chk(r in RAZAS, "%s: raza invalida %r" % (c["id"], r))
    chk(c["genero"] in GENEROS, "%s: genero invalido" % c["id"])
    for a in c["afiliacion_principal"]:
        chk(a in AFILIACIONES, "%s: afiliacion invalida %r" % (c["id"], a))
    chk(c["universo"] in UNIVERSOS, "%s: universo invalido" % c["id"])
    chk(c["rol_narrativo"] in ROLES, "%s: rol invalido" % c["id"])
    chk(c["estado"] in ESTADOS, "%s: estado invalido" % c["id"])
    chk(c["debut"] in DEBUT_IDX, "%s: debut fuera de la lista ordinal" % c["id"])
    chk(c["altura_fuente"] in (CANON, EST), "%s: altura_fuente invalida" % c["id"])
    chk(isinstance(c["altura_cm"], int) and 10 < c["altura_cm"] < 600, "%s: altura fuera de rango" % c["id"])
    chk(c["tiene_transformaciones"] == bool(c["transformaciones"]),
        "%s: tiene_transformaciones no concuerda con la lista" % c["id"])

# ---- REGLA DE UNICIDAD (README seccion 4) ---------------------------------
# Espejo de categoriasClasico en packages/dragonballdle-data/src/index.ts: son
# los atributos que el jugador VE. es_fusion y rol_narrativo siguen en el
# dataset pero salieron de la tabla, asi que no cuentan para la unicidad.
COMPARABLES = ["raza", "genero", "debut", "afiliacion_principal", "universo",
               "tiene_transformaciones", "altura_cm", "estado"]

def firma(c, campos=COMPARABLES):
    out = []
    for k in campos:
        v = c[k]
        out.append(tuple(sorted(v)) if isinstance(v, list) else v)
    return tuple(out)

buckets = defaultdict(list)
for c in R:
    buckets[firma(c)].append(c["id"])
colisiones = {k: v for k, v in buckets.items() if len(v) > 1}

# cuasi-colisiones: identicos en todo menos altura_cm
SIN_ALTURA = [k for k in COMPARABLES if k != "altura_cm"]
b2 = defaultdict(list)
for c in R:
    b2[firma(c, SIN_ALTURA)].append((c["id"], c["altura_cm"]))
cuasi = {k: v for k, v in b2.items() if len(v) > 1}

# =============================================================== SALIDA
os.makedirs(OUT_DIR, exist_ok=True)
doc = {
    "version": "1.0.0",
    "generado_por": "build_dataset.py (agente de datos)",
    "fecha": "2026-08-01",
    "nota": ("Alcance canon según README §2.1. Ver data/taxonomias.md, "
             "data/debut-orden.md, y README §5 y §7."),
    "taxonomias": {
        "raza": RAZAS, "genero": GENEROS, "afiliacion_principal": AFILIACIONES,
        "rol_narrativo": ROLES, "estado": ESTADOS, "universo": UNIVERSOS,
        "debut": [{"indice": i, "nombre": n} for i, n in DEBUTS],
    },
    "personajes": R,
}
path = os.path.join(OUT_DIR, "personajes.json")
with open(path, "w", encoding="utf-8") as f:
    json.dump(doc, f, ensure_ascii=False, indent=2)

print("=" * 72)
print("DATASET DragonBallDle v1 - reporte de validacion")
print("=" * 72)
print("Archivo escrito : %s (%d bytes)" % (path, os.path.getsize(path)))
print("Personajes      : %d" % len(R))
print()
print("-- Distribuciones --")
print("rol_narrativo   :", dict(Counter(c["rol_narrativo"] for c in R)))
print("estado          :", dict(Counter(c["estado"] for c in R)))
print("genero          :", dict(Counter(c["genero"] for c in R)))
print("universo        :", dict(Counter(c["universo"] for c in R)))
print("altura_fuente   :", dict(Counter(c["altura_fuente"] for c in R)))
print("es_fusion       :", dict(Counter(c["es_fusion"] for c in R)))
print("transformaciones:", dict(Counter(c["tiene_transformaciones"] for c in R)))
rc = Counter()
for c in R:
    rc.update(c["raza"])
print("raza            :", dict(rc.most_common()))
ac = Counter()
for c in R:
    ac.update(c["afiliacion_principal"])
print("afiliacion      :", dict(ac.most_common()))
dc = Counter(c["debut"] for c in R)
print("debut (top)     :", dict(dc.most_common(8)))
print("debuts usados   : %d de %d valores de la lista ordinal" % (len(dc), len(DEBUTS)))
print()
print("-- Assets --")
con_img = sum(1 for c in R if c["imagen_base"])
n_tf = sum(len(c["transformaciones"]) for c in R)
print("imagen_base desde API : %d / %d  (faltan %d)" % (con_img, len(R), len(R) - con_img))
print("total de formas listadas para Splash-zoom : %d" % n_tf)
print("imagenes totales necesarias (base + formas): %d" % (len(R) + n_tf))
print("personajes sin imagen base:",
      ", ".join(c["id"] for c in R if not c["imagen_base"]))
print()
print("-- Alturas estimadas (revisar) --")
print(", ".join("%s=%d" % (c["id"], c["altura_cm"]) for c in R if c["altura_fuente"] == EST))
print()
print("-- REGLA DE UNICIDAD (README seccion 4) --")
print("Atributos comparables: %s" % ", ".join(COMPARABLES))
if colisiones:
    print("RESULTADO: FALLA - %d colision(es)" % len(colisiones))
    for k, v in colisiones.items():
        print("   %s  -> %s" % (v, k))
else:
    print("RESULTADO: OK - 0 colisiones. Las %d firmas son unicas." % len(buckets))
print()
print("-- Cuasi-colisiones (solo difieren en altura_cm; el motor SI las distingue) --")
if cuasi:
    for k, v in sorted(cuasi.items(), key=lambda x: -len(x[1])):
        print("   %s" % (v,))
else:
    print("   ninguna")
print()
print("-- Errores de taxonomia --")
print("\n".join("   ERROR " + e for e in errors) if errors else "   ninguno")
print("-- Avisos --")
print("\n".join("   AVISO " + w for w in warnings) if warnings else "   ninguno")
print()
with open(path, encoding="utf-8") as f:
    json.load(f)
print("JSON re-parseado correctamente.")
sys.exit(1 if errors or colisiones else 0)
