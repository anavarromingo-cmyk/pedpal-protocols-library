// State for favorites
let favorites = {
  sintomas: [],
  farmacos: []
};

// Mapeo de síntomas a algoritmos específicos
const mapeoSintomaAlgoritmo = {
  "Dolor": "Estrategia Bifásica de la OMS para Dolor Persistente",
  "Convulsiones": "Manejo del Estatus Epiléptico Convulsivo",
  "Estatus Epiléptico": "Manejo del Estatus Epiléptico en Situación de Final de Vida",
  "Irritabilidad": "Escalera Terapéutica para Irritabilidad",
  "Agitación": "Escalera Terapéutica para Irritabilidad",
  "Espasticidad": "Algoritmo de Tratamiento Farmacológico de la Espasticidad",
  "Prurito": "Manejo del Prurito",
  "Reflujo": "Algoritmo de Manejo del Reflujo Gastroesofágico",
  "RGE": "Algoritmo de Manejo del Reflujo Gastroesofágico",
  "Disfagia": "Abordaje de la Disfagia Orofaríngea en Cuidados Paliativos",
  "Trastornos Deglucion": "Abordaje de la Disfagia Orofaríngea en Cuidados Paliativos",
  "Traqueostomia": "Actuación ante Emergencia en Niño Traqueotomizado",
  "Nutrición": "Algoritmo de Elección de Dispositivo de Nutrición Enteral",
  "Sedación": "Algoritmo de Sedación Paliativa Neonatal",
  "Crisis Disautonómicas": "Tratamiento de Crisis Disautonómicas"
};

// Data structure
const data = {
  sintomas_json: [
    {
      nombre: "Sialorrea",
      categoria: "respiratorio",
      descripcion: "Acumulación excesiva de saliva en la cavidad oral, frecuente en pacientes neurológicos",
      manejo_no_farmacologico: [
        "Posicionamiento adecuado (cabeza elevada)",
        "Fisioterapia orofacial",
        "Aspiración suave si precisa",
        "Control de estímulos salivales"
      ],
      manejo_farmacologico: [
        { farmaco: "Glicopirrolato", dosis: "4-10 mcg/kg cada 6-8h (máx 200 mcg/dosis)", via: "SC, IV, Oral", notas: "Primera línea, mejor tolerado" },
        { farmaco: "Atropina", dosis: "1-2 gotas oftálmicas sublinguales cada 4-6h", via: "Sublingual", notas: "Opción oral" },
        { farmaco: "Butilbromuro de hioscina", dosis: "0.3-0.5 mg/kg cada 6-8h (máx 20mg/dosis)", via: "SC, IV", notas: "Alternativa" },
        { farmaco: "Toxina botulínica", dosis: "Según glándula y peso", via: "Inyección glandular", notas: "Para casos refractarios" }
      ],
      algoritmo: false
    },
    {
      nombre: "Dolor",
      categoria: "dolor",
      descripcion: "Dolor nociceptivo, neuropático o mixto en cuidados paliativos pediátricos",
      manejo_no_farmacologico: [
        "Fisioterapia y posicionamiento adecuado",
        "Técnicas de distracción y relajación",
        "Aplicación de calor o frío local",
        "Masajes y técnicas de confort"
      ],
      manejo_farmacologico: [
        { farmaco: "Paracetamol", dosis: "10-15 mg/kg cada 4-6h", via: "Oral, IV, Rectal", notas: "Máximo 75 mg/kg/día" },
        { farmaco: "Ibuprofeno", dosis: "4-10 mg/kg cada 6-8h", via: "Oral", notas: "Máximo 40 mg/kg/día" },
        { farmaco: "Morfina", dosis: "Oral: 0.2-0.5 mg/kg cada 4-6h, IV/SC: 0.05-0.1 mg/kg cada 4h", via: "Oral, SC, IV", notas: "Sin techo analgésico" },
        { farmaco: "Gabapentina", dosis: "Inicio: 5-10 mg/kg noche, titular hasta 45-60 mg/kg/día en 3 dosis", via: "Oral", notas: "Especialmente para dolor neuropático" }
      ],
      algoritmo: true
    },
    {
      nombre: "Disnea",
      categoria: "respiratorio",
      descripcion: "Sensación subjetiva de dificultad respiratoria",
      manejo_no_farmacologico: [
        "Posición semiincorporada",
        "Ventilador facial directo",
        "Oxigenoterapia si hipoxemia",
        "Ambiente tranquilo y fresco"
      ],
      manejo_farmacologico: [
        { farmaco: "Morfina", dosis: "25-50% de la dosis para dolor, aumentar gradualmente", via: "Oral, SC, IV", notas: "Fármaco de elección" },
        { farmaco: "Lorazepam", dosis: "25 mcg/kg 2-3 veces/día (<2a), 0.5-2mg según edad", via: "Oral, Sublingual", notas: "Si ansiedad asociada" },
        { farmaco: "Midazolam", dosis: "50-300 mcg/kg/h en perfusión", via: "SC, IV", notas: "Para sedación paliativa" }
      ],
      algoritmo: false
    },
    {
      nombre: "Espasticidad",
      categoria: "neurologico",
      descripcion: "Aumento del tono muscular dependiente de velocidad, resistencia en navaja",
      manejo_no_farmacologico: [
        "Fisioterapia regular y estiramientos",
        "Posicionamiento adecuado",
        "Órtesis y ayudas técnicas",
        "Hidroterapia si disponible"
      ],
      manejo_farmacologico: [
        { farmaco: "Baclofeno", dosis: "2-7 años: inicio 2.5-5 mg/día, máx 30 mg/día. >8 años: hasta 60 mg/día", via: "Oral, Intratecal", notas: "Fármaco de primera línea" },
        { farmaco: "Diazepam", dosis: "0.12-0.8 mg/kg/día dividido en 3-4 dosis", via: "Oral, IV", notas: "Alternativa" },
        { farmaco: "Toxina botulínica", dosis: "Según músculo y peso", via: "Intramuscular", notas: "Para espasticidad focal" }
      ],
      algoritmo: true
    },
    {
      nombre: "Irritabilidad y Agitación",
      categoria: "neurologico",
      descripcion: "Estado de excitación en pacientes con déficit neurológico grave",
      manejo_no_farmacologico: [
        "Ambiente tranquilo y predecible",
        "Rutinas consistentes",
        "Control de estímulos sensoriales",
        "Identificar y tratar causas subyacentes"
      ],
      manejo_farmacologico: [
        { farmaco: "Gabapentina", dosis: "Día 1-3: 5-10 mg/kg noche, titular hasta 45-60 mg/kg/día", via: "Oral", notas: "Primera línea" },
        { farmaco: "Pregabalina", dosis: "1 mg/kg noche, titular hasta 5-10 mg/kg/día", via: "Oral", notas: "Potencia 6x mayor que gabapentina" },
        { farmaco: "Clonidina", dosis: "0.002 mg/kg titular cada 2-3 días hasta 0.012 mg/kg/dosis 3 veces/día", via: "Oral", notas: "Si disautonomía" },
        { farmaco: "Metadona", dosis: "30-100 mcg/kg (máx 5mg) 1-3 veces/día", via: "Oral, SC, IV", notas: "Tercera línea" }
      ],
      algoritmo: true
    },
    {
      nombre: "Náuseas y Vómitos",
      categoria: "gastrointestinal",
      descripcion: "Síntoma frecuente multifactorial en cuidados paliativos",
      manejo_no_farmacologico: [
        "Comidas pequeñas y frecuentes",
        "Evitar olores desencadenantes",
        "Posición semiincorporada tras ingesta",
        "Técnicas de relajación"
      ],
      manejo_farmacologico: [
        { farmaco: "Ondansetrón", dosis: "100 mcg/kg cada 8-12h (máx 4mg/dosis)", via: "Oral, SC, IV", notas: "Primera línea" },
        { farmaco: "Haloperidol", dosis: "10-20 mcg/kg cada 8-12h (1m-11a), 1.5mg/12h (12-17a)", via: "Oral, SC, IV", notas: "Si causa central" },
        { farmaco: "Metoclopramida", dosis: "0.1-0.2 mg/kg cada 6-8h", via: "Oral, SC, IV", notas: "Si gastroparesia" }
      ],
      algoritmo: false
    },
    {
      nombre: "Convulsiones",
      categoria: "neurologico",
      descripcion: "Crisis epilépticas que pueden aumentar al final de vida",
      manejo_no_farmacologico: [
        "Proteger durante la crisis",
        "Posición lateral de seguridad",
        "Evitar desencadenantes conocidos",
        "Monitorización estrecha"
      ],
      manejo_farmacologico: [
        { farmaco: "Midazolam", dosis: "Bucal/Intranasal: 200-300 mcg/kg (6m-9a). IV/SC: 25-50 mcg/kg", via: "Bucal, Intranasal, SC, IV", notas: "Primera línea para crisis aguda" },
        { farmaco: "Diazepam", dosis: "Rectal: 0.5 mg/kg (máx 20mg). IV: 0.15-0.3 mg/kg", via: "Rectal, IV", notas: "Alternativa" },
        { farmaco: "Levetiracetam", dosis: "20-40 mg/kg/día en 2 dosis", via: "Oral, IV", notas: "Mantenimiento" }
      ],
      algoritmo: false
    },
    {
      nombre: "Estertores",
      categoria: "respiratorio",
      descripcion: "Sonidos respiratorios por acumulación de secreciones en fase final",
      manejo_no_farmacologico: [
        "Posición lateral",
        "NO aspirar (no mejora y es molesto)",
        "Explicar a familia que no causa disnea",
        "Ambiente tranquilo"
      ],
      manejo_farmacologico: [
        { farmaco: "Glicopirrolato", dosis: "4-10 mcg/kg cada 6-8h (máx 200 mcg/dosis)", via: "SC, IV", notas: "Anticolinérgico de elección" },
        { farmaco: "Butilbromuro de hioscina", dosis: "0.3-0.5 mg/kg cada 6-8h (máx 20mg/dosis)", via: "SC, IV", notas: "Alternativa" },
        { farmaco: "Atropina", dosis: "1-2 gotas oftálmicas sublinguales cada 4-6h", via: "Sublingual", notas: "Opción oral" }
      ],
      algoritmo: false
    },
    {
      nombre: "Estreñimiento",
      categoria: "gastrointestinal",
      descripcion: "Complicación frecuente, especialmente con opioides",
      manejo_no_farmacologico: [
        "Ingesta adecuada de líquidos",
        "Dieta rica en fibra si tolera",
        "Movilización según capacidad",
        "Masaje abdominal"
      ],
      manejo_farmacologico: [
        { farmaco: "Polietilenglicol (Macrogol)", dosis: "0.5-1.5 g/kg/día (máx 20g/día)", via: "Oral", notas: "Primera línea" },
        { farmaco: "Lactulosa", dosis: "1-3 ml/kg/día en 2 dosis", via: "Oral", notas: "Alternativa" },
        { farmaco: "Bisacodilo", dosis: "5-10mg/día según edad", via: "Oral, Rectal", notas: "Estimulante" },
        { farmaco: "Senósidos", dosis: "Según edad y presentación", via: "Oral", notas: "Estimulante" }
      ],
      algoritmo: false
    },
    {
      nombre: "Crisis Disautonómicas",
      categoria: "neurologico",
      descripcion: "Episodios de hiperactividad simpática con taquicardia, HTA, hipertermia y posturas distónicas",
      manejo_no_farmacologico: [
        "Control del dolor (principal desencadenante)",
        "Ambiente tranquilo",
        "Evitar estímulos nociceptivos",
        "Temperatura ambiente adecuada"
      ],
      manejo_farmacologico: [
        { farmaco: "Clonidina", dosis: "Inicio 0.002 mg/kg/día, titular hasta 0.012 mg/kg/dosis 3 veces/día", via: "Oral", notas: "Agonista α2 adrenérgico" },
        { farmaco: "Propranolol", dosis: "1-2 mg/kg/día en 2-3 dosis", via: "Oral", notas: "Beta-bloqueante" },
        { farmaco: "Gabapentina", dosis: "45-60 mg/kg/día en 3 dosis", via: "Oral", notas: "Modulador SNC" },
        { farmaco: "Morfina", dosis: "0.2-0.5 mg/kg cada 4-6h", via: "Oral, SC, IV", notas: "Si dolor asociado" }
      ],
      algoritmo: true
    }
  ],
  farmacos_json: [
    {
      nombre: "Morfina",
      categoria: "Opioide mayor",
      usos: ["Dolor moderado-severo", "Disnea", "Tos refractaria"],
      vias: ["Oral", "Subcutánea", "Intravenosa", "Rectal"],
      dosis: {
        oral: "0.2-0.5 mg/kg cada 4-6h",
        sc_iv: "0.05-0.2 mg/kg cada 4h (máx 15mg/24h)",
        perfusion: "0.04-0.07 mg/kg/h",
        rescate: "1/6 de dosis diaria total"
      },
      presentaciones: ["Solución oral 2mg/ml", "Comprimidos 10-20mg", "Solución inyectable 1% y 2%"],
      notas: "Sin techo analgésico. Para disnea usar 25-50% de dosis analgésica."
    },
    {
      nombre: "Fentanilo",
      categoria: "Opioide mayor",
      usos: ["Dolor moderado-severo", "Sedoanalgesia", "Dolor irruptivo"],
      vias: ["Transdérmica", "Intravenosa", "Intranasal", "Transmucosa"],
      dosis: {
        iv_carga: "2 mcg/kg en 10 minutos",
        perfusion: "Iniciar 3 mcg/kg/h, aumentar 1 mcg/kg/h cada 30min si precisa",
        transdermica: "Según conversión desde morfina"
      },
      presentaciones: ["Parches transdérmicos", "Solución inyectable", "Spray nasal"],
      notas: "Potencia 100 veces mayor que morfina. Inicio rápido y corta duración."
    },
    {
      nombre: "Metadona",
      categoria: "Opioide mayor",
      usos: ["Dolor refractario", "Dolor neuropático", "Irritabilidad refractaria", "Rotación opioide"],
      vias: ["Oral", "Subcutánea", "Intravenosa"],
      dosis: {
        ninos_1_12_anos: "30-100 mcg/kg (máx 5mg inicial) 1-3 veces/día",
        mayores_12_anos: "100-200 mcg/kg cada 8-12h (máx 5mg inicial)"
      },
      presentaciones: ["Solución oral", "Comprimidos", "Solución inyectable"],
      notas: "Vida media muy variable (8-80h). Requiere titulación cuidadosa. Antagonista NMDA."
    },
    {
      nombre: "Glicopirrolato",
      categoria: "Anticolinérgico",
      usos: ["Sialorrea", "Estertores", "Secreción respiratoria"],
      vias: ["Oral", "Subcutánea", "Intravenosa"],
      dosis: {
        oral: "4-10 mcg/kg cada 6-8h",
        sc_iv: "4-10 mcg/kg cada 6-8h (máx 200 mcg/dosis)"
      },
      presentaciones: ["Comprimidos 1mg, 2mg", "Ampollas 200 mcg/ml"],
      notas: "No cruza barrera hematoencefálica. Mejor tolerado que atropina."
    },
    {
      nombre: "Butilbromuro de hioscina",
      categoria: "Anticolinérgico",
      usos: ["Estertores", "Sialorrea", "Cólico abdominal"],
      vias: ["Oral", "Subcutánea", "Intravenosa"],
      dosis: {
        oral: "0.3-0.5 mg/kg cada 6-8h",
        sc_iv: "0.3-0.5 mg/kg cada 6-8h (máx 20mg/dosis)"
      },
      presentaciones: ["Comprimidos 10mg", "Ampollas 20mg/ml"],
      notas: "Acción antiespasmódica adicional."
    },
    {
      nombre: "Propranolol",
      categoria: "Beta-bloqueante",
      usos: ["Crisis disautonómicas", "Taquicardia", "Hipertensión"],
      vias: ["Oral"],
      dosis: {
        oral: "1-2 mg/kg/día dividido en 2-3 dosis",
        maxima: "4 mg/kg/día"
      },
      presentaciones: ["Comprimidos 10mg, 40mg", "Solución oral 5mg/5ml"],
      notas: "Contraindicado en asma y bradicardia."
    },
    {
      nombre: "Tramadol",
      categoria: "Opioide débil",
      usos: ["Dolor moderado"],
      vias: ["Oral"],
      dosis: {
        oral: "1-2 mg/kg cada 6-8h (máx 400mg/día)"
      },
      presentaciones: ["Cápsulas 50mg", "Gotas orales 100mg/ml"],
      notas: "Riesgo de convulsiones en pacientes predispuestos."
    },
    {
      nombre: "Codeína",
      categoria: "Opioide débil",
      usos: ["Dolor leve-moderado", "Tos"],
      vias: ["Oral"],
      dosis: {
        oral: "0.5-1 mg/kg cada 4-6h"
      },
      presentaciones: ["Jarabe con paracetamol"],
      notas: "Metabolización variable genéticamente."
    },
    {
      nombre: "Levomepromazina",
      categoria: "Neuroléptico",
      usos: ["Náuseas refractarias", "Agitación", "Sedación paliativa"],
      vias: ["Oral", "Subcutánea"],
      dosis: {
        oral: "0.25-1 mg/kg/día en 2-3 dosis",
        sc: "0.35-3 mg/kg/día en perfusión"
      },
      presentaciones: ["Comprimidos 25mg", "Gotas 40mg/ml", "Ampollas 25mg/ml"],
      notas: "Perfil muy sedante. Útil en sedación paliativa."
    },
    {
      nombre: "Metoclopramida",
      categoria: "Antiemético procinético",
      usos: ["Náuseas y vómitos", "Gastroparesia"],
      vias: ["Oral", "Subcutánea", "Intravenosa"],
      dosis: {
        oral_iv: "0.1-0.2 mg/kg cada 6-8h (máx 0.5 mg/kg/día)"
      },
      presentaciones: ["Comprimidos 10mg", "Solución oral 1mg/ml", "Ampollas 10mg/2ml"],
      notas: "Riesgo de síntomas extrapiramidales."
    },
    {
      nombre: "Polietilenglicol (Macrogol)",
      categoria: "Laxante osmótico",
      usos: ["Estreñimiento"],
      vias: ["Oral"],
      dosis: {
        pediatrica: "0.5-1.5 g/kg/día (máx 20g/día)"
      },
      presentaciones: ["Sobres 13.8g"],
      notas: "Primera línea para estreñimiento. Bien tolerado."
    },
    {
      nombre: "Lactulosa",
      categoria: "Laxante osmótico",
      usos: ["Estreñimiento"],
      vias: ["Oral"],
      dosis: {
        pediatrica: "1-3 ml/kg/día en 2 dosis"
      },
      presentaciones: ["Solución oral 667mg/ml"],
      notas: "Puede causar flatulencia y distensión abdominal."
    },
    {
      nombre: "Bisacodilo",
      categoria: "Laxante estimulante",
      usos: ["Estreñimiento"],
      vias: ["Oral", "Rectal"],
      dosis: {
        oral: "5-10mg/día según edad",
        rectal: "5-10mg/día"
      },
      presentaciones: ["Comprimidos 5mg", "Supositorios 5mg, 10mg"],
      notas: "No usar de forma prolongada sin laxantes osmóticos."
    },
    {
      nombre: "Senósidos",
      categoria: "Laxante estimulante",
      usos: ["Estreñimiento"],
      vias: ["Oral"],
      dosis: {
        pediatrica: "Según edad y presentación comercial"
      },
      presentaciones: ["Comprimidos", "Solución oral"],
      notas: "Laxante estimulante de origen vegetal."
    },
    {
      nombre: "Dexametasona",
      categoria: "Corticoide",
      usos: ["Edema cerebral", "Compresión medular", "Náuseas", "Anorexia"],
      vias: ["Oral", "Subcutánea", "Intravenosa"],
      dosis: {
        oral_iv: "0.15-0.5 mg/kg/día en 1-2 dosis (según indicación)"
      },
      presentaciones: ["Comprimidos 1mg, 4mg", "Ampollas 4mg/ml"],
      notas: "Útil en últimas semanas de vida para múltiples síntomas."
    },
    {
      nombre: "Gabapentina",
      categoria: "Anticonvulsivante / Neuropático",
      usos: ["Dolor neuropático", "Irritabilidad cerebral", "Hiperalgesia visceral", "Crisis disautonómicas"],
      vias: ["Oral"],
      dosis: {
        menores_3_anos: "5 mg/kg/dosis e ir aumentando",
        inicio_3_12_anos: "Día 1: 5-10 mg/kg noche, Día 2: 2 veces/día, Día 3: 3 veces/día",
        mantenimiento: "45-60 mg/kg/día en 3 dosis",
        dosis_maxima: "Hasta 3600mg/día"
      },
      presentaciones: ["Cápsulas 100, 300, 400mg", "Comprimidos 300, 600, 800mg", "Suspensión oral 100mg/ml (FM)"],
      notas: "Primera línea para dolor neuropático e irritabilidad. Titular gradualmente."
    },
    {
      nombre: "Pregabalina",
      categoria: "Anticonvulsivante / Neuropático",
      usos: ["Dolor neuropático", "Ansiedad generalizada"],
      vias: ["Oral"],
      dosis: {
        inicio: "1 mg/kg noche (días 1-3), luego 1 mg/kg 2 veces/día (días 4-6)",
        mantenimiento: "5-10 mg/kg/día en 2-3 dosis",
        maxima: "600 mg/día"
      },
      presentaciones: ["Cápsulas 25, 50, 75, 100, 150, 200, 300mg"],
      notas: "Potencia 6 veces mayor que gabapentina. Conversión 6:1 desde gabapentina."
    },
    {
      nombre: "Midazolam",
      categoria: "Benzodiacepina",
      usos: ["Ansiedad", "Agitación", "Convulsiones", "Sedación paliativa", "Disnea"],
      vias: ["Oral", "Bucal", "Intranasal", "Subcutánea", "Intravenosa"],
      dosis: {
        oral: "500 mcg/kg dosis única (máx 20mg)",
        bucal_intranasal: "200-300 mcg/kg (6m-9a, máx 5mg); 10mg (10-17a)",
        sc_iv_bolus: "25-50 mcg/kg en 2-3 min",
        perfusion: "50-300 mcg/kg/h"
      },
      presentaciones: ["Solución oral", "Ampollas 5mg/5ml, 15mg/3ml"],
      notas: "Inicio rápido. Útil para crisis convulsivas y sedación terminal."
    },
    {
      nombre: "Lorazepam",
      categoria: "Benzodiacepina",
      usos: ["Ansiedad", "Agitación", "Disnea con ansiedad"],
      vias: ["Oral", "Sublingual"],
      dosis: {
        menores_2a: "25 mcg/kg 2-3 veces/día",
        edad_2_5a: "500 mcg 2-3 veces/día",
        edad_6_10a: "750 mcg 3 veces/día",
        edad_11_14a: "1 mg 3 veces/día",
        edad_15_18a: "1-2 mg 3 veces/día"
      },
      presentaciones: ["Comprimidos 1mg, 5mg"],
      notas: "Vida media intermedia. Buena opción para ansiedad mantenida."
    },
    {
      nombre: "Baclofeno",
      categoria: "Relajante muscular",
      usos: ["Espasticidad generalizada", "Dolor asociado a espasticidad", "Clonus", "Rigidez"],
      vias: ["Oral", "Intratecal"],
      dosis: {
        edad_2_7_anos: "Inicio 2.5-5 mg/día en 3 tomas, aumentar semanalmente hasta máx 30 mg/día",
        mayores_8_anos: "Hasta 60 mg/día en 3 tomas"
      },
      presentaciones: ["Comprimidos 10mg y 25mg", "Bomba intratecal"],
      notas: "Primera línea para espasticidad. No suspender bruscamente (riesgo convulsiones)."
    },
    {
      nombre: "Haloperidol",
      categoria: "Neuroléptico",
      usos: ["Náuseas y vómitos", "Agitación", "Delirium", "Hipo intratable"],
      vias: ["Oral", "Subcutánea", "Intravenosa"],
      dosis: {
        oral_1m_11a: "10-20 mcg/kg cada 8-12h (máx 50-60 mcg/kg/dosis)",
        oral_12_17a: "1.5 mg noche, puede aumentar a 1.5 mg/12h (máx 5 mg/12h)",
        perfusion: "Inicial 25 mcg/kg/día (1m-11a), máx 85 mcg/kg/día"
      },
      presentaciones: ["Gotas orales 2mg/ml", "Comprimidos 10mg", "Ampollas 5mg/ml"],
      notas: "Antiemético de elección para náuseas de origen central. Vigilar síntomas extrapiramidales."
    },
    {
      nombre: "Ondansetrón",
      categoria: "Antiemético (antagonista 5-HT3)",
      usos: ["Náuseas y vómitos", "Especialmente por quimioterapia"],
      vias: ["Oral", "Sublingual", "Subcutánea", "Intravenosa"],
      dosis: {
        todas_vias: "100 mcg/kg cada 8-12h (máx 4 mg/dosis)"
      },
      presentaciones: ["Comprimidos 4mg, 8mg", "Flas 4mg, 8mg", "Ampollas 4mg/2ml, 8mg/4ml"],
      notas: "Primera línea para náuseas/vómitos. Bien tolerado."
    },
    {
      nombre: "Clonidina",
      categoria: "Agonista α2-adrenérgico",
      usos: ["Disfunción autonómica", "Irritabilidad", "Crisis disautonómicas", "Dolor neuropático"],
      vias: ["Oral"],
      dosis: {
        inicio: "0.002 mg/kg noche (días 1-3), luego 2 veces/día (días 4-6), luego 3 veces/día",
        maxima: "0.012 mg/kg/dosis (0.6mg para ≥50kg) 3 veces/día"
      },
      presentaciones: ["Comprimidos 150 mcg", "Fórmula magistral suspensión oral"],
      notas: "Útil en disautonomía. Titular lentamente. No suspender bruscamente."
    },
    {
      nombre: "Amitriptilina",
      categoria: "Antidepresivo tricíclico",
      usos: ["Dolor neuropático", "Hiperalgesia visceral", "Insomnio"],
      vias: ["Oral"],
      dosis: {
        edad_2_11_anos: "Inicial 200 mcg/kg (máx 10mg) noche, aumentar gradualmente",
        edad_12_17_anos: "Inicial 10 mg noche, aumentar cada 3-5 días si precisa (máx 75 mg/día)"
      },
      presentaciones: ["Comprimidos 10mg, 25mg, 50mg, 75mg"],
      notas: "Segunda línea para dolor neuropático. Efecto anticolinérgico (boca seca, estreñimiento)."
    },
    {
      nombre: "Paracetamol",
      categoria: "Analgésico no opioide",
      usos: ["Dolor leve-moderado", "Fiebre"],
      vias: ["Oral", "Rectal", "Intravenosa"],
      dosis: {
        rn_3m: "5-10 mg/kg cada 6-8h",
        ninos_adolescentes: "10-15 mg/kg cada 4-6h",
        maxima: "75 mg/kg/día o 4g/día (lo menor)"
      },
      presentaciones: ["Solución oral 100mg/ml", "Comprimidos diversos", "Supositorios", "Vial IV 10mg/ml"],
      notas: "Primera línea para dolor leve-moderado. Seguro. No antiinflamatorio."
    },
    {
      nombre: "Ibuprofeno",
      categoria: "AINE",
      usos: ["Dolor leve-moderado", "Inflamación", "Fiebre"],
      vias: ["Oral"],
      dosis: {
        pediatrica: "4-10 mg/kg cada 6-8h",
        maxima: "40 mg/kg/día o 1200mg/día"
      },
      presentaciones: ["Solución oral 20mg/ml, 40mg/ml", "Comprimidos 400mg, 600mg"],
      notas: "Contraindicado en trastornos de coagulación y trombopenia. Tomar con alimentos."
    },
    {
      nombre: "Diazepam",
      categoria: "Benzodiacepina",
      usos: ["Espasticidad", "Ansiedad", "Convulsiones"],
      vias: ["Oral", "Rectal", "Intravenosa"],
      dosis: {
        oral: "0.12-0.8 mg/kg/día dividido en 3-4 dosis",
        rectal_convulsion: "0.5 mg/kg (máx 20mg)",
        iv: "0.04-0.3 mg/kg/dosis cada 2-4h (máx 0.6 mg/kg en 8h)"
      },
      presentaciones: ["Comprimidos 2.5mg, 5mg, 10mg", "Solución rectal (Stesolid)", "Ampollas 10mg/2ml"],
      notas: "Vida media larga. Útil para espasticidad y convulsiones."
    }
  ],
  algoritmos_predefinidos: [
    {
      nombre: "Estrategia Bifásica de la OMS para Dolor Persistente",
      objetivo: "Abordaje sistemático del dolor persistente en cuidados paliativos pediátricos",
      poblacion: "Niños y adolescentes con dolor persistente",
      pasos: [
        {
          paso: 1,
          titulo: "Fase 1: Dolor Leve",
          descripcion: "Analgésicos no opioides + medidas no farmacológicas",
          farmacos: ["Paracetamol", "Ibuprofeno", "Metamizol"]
        },
        {
          paso: 2,
          titulo: "Fase 2: Dolor Moderado-Severo",
          descripcion: "Opioides mayores (sin tramadol ni codeína) + no opioides + coadyuvantes según tipo de dolor",
          farmacos: ["Morfina", "Fentanilo", "Hidromorfona", "Oxicodona", "Metadona", "Paracetamol", "Gabapentina"]
        }
      ]
    },
    {
      nombre: "Toma de Decisiones Compartidas (Modelo Opel DJ)",
      objetivo: "Facilitar la toma de decisiones éticas en situaciones de limitación del esfuerzo terapéutico",
      poblacion: "Todas las edades en situación de decisión clínica compleja",
      pasos: [
        {
          paso: 1,
          titulo: "Valoración clínica",
          descripcion: "Evaluación del estado del paciente, pronóstico y opciones terapéuticas disponibles",
          farmacos: []
        },
        {
          paso: 2,
          titulo: "Identificación de valores y preferencias",
          descripcion: "Diálogo con familia y paciente (si edad y capacidad lo permiten) sobre objetivos de cuidado",
          farmacos: []
        },
        {
          paso: 3,
          titulo: "Propuesta de plan terapéutico",
          descripcion: "Presentación de opciones alineadas con mejor interés del paciente",
          farmacos: []
        },
        {
          paso: 4,
          titulo: "Decisión compartida y seguimiento",
          descripcion: "Consenso, documentación y revisión periódica del plan",
          farmacos: []
        }
      ]
    },
    {
      nombre: "Algoritmo de Sedación Paliativa Neonatal",
      objetivo: "Proporcionar confort en situación de final de vida neonatal",
      poblacion: "Neonatos en situación de limitación del esfuerzo terapéutico",
      pasos: [
        {
          paso: 1,
          titulo: "Valoración de síntomas refractarios",
          descripcion: "Identificar dolor, disnea, agitación no controlables con tratamiento convencional",
          farmacos: []
        },
        {
          paso: 2,
          titulo: "Sedoanalgesia inicial",
          descripcion: "Fentanilo: carga 2mcg/kg + perfusión 3mcg/kg/h. Midazolam: 1mcg/kg/min",
          farmacos: ["Fentanilo", "Midazolam"]
        },
        {
          paso: 3,
          titulo: "Titulación según respuesta",
          descripcion: "Aumentar Fentanilo 1mcg/kg/h cada 30min si precisa. Valorar Morfina si sedación prolongada",
          farmacos: ["Fentanilo", "Morfina"]
        },
        {
          paso: 4,
          titulo: "Cuidados de confort",
          descripcion: "Acompañamiento familiar, piel con piel, ambiente tranquilo",
          farmacos: []
        }
      ]
    },
    {
      nombre: "Algoritmo de Tratamiento Farmacológico de la Espasticidad",
      objetivo: "Reducción de la hipertonicidad muscular y mejora funcional",
      poblacion: "Niños con espasticidad secundaria a parálisis cerebral o enfermedades neurodegenerativas",
      pasos: [
        {
          paso: 1,
          titulo: "Tratamiento oral de primera línea",
          descripcion: "Baclofeno oral: 2-7años inicio 2.5-5mg/día en 3 tomas (máx 30mg/día). >8años hasta 60mg/día",
          farmacos: ["Baclofeno"]
        },
        {
          paso: 2,
          titulo: "Alternativas orales",
          descripcion: "Si intolerancia o respuesta insuficiente: Tizanidina o Diazepam",
          farmacos: ["Tizanidina", "Diazepam"]
        },
        {
          paso: 3,
          titulo: "Tratamiento focal",
          descripcion: "Toxina botulínica intramuscular para espasticidad focal o regional",
          farmacos: ["Toxina botulínica"]
        },
        {
          paso: 4,
          titulo: "Tratamiento intratecal",
          descripcion: "Baclofeno intratecal mediante bomba programable para espasticidad generalizada refractaria",
          farmacos: ["Baclofeno intratecal"]
        }
      ]
    },
    {
      nombre: "Algoritmo de Elección de Dispositivo de Nutrición Enteral",
      objetivo: "Selección del dispositivo más adecuado según duración esperada y situación clínica",
      poblacion: "Niños con disfagia o imposibilidad de alimentación oral",
      pasos: [
        {
          paso: 1,
          titulo: "Valoración de duración estimada",
          descripcion: "<4-6 semanas: considerar sonda nasogástrica. >4-6 semanas: gastrostomía",
          farmacos: []
        },
        {
          paso: 2,
          titulo: "Si nutrición <6 semanas",
          descripcion: "Sonda nasogástrica (SNG). Si reflujo severo: sonda nasoyeyunal (SNY)",
          farmacos: []
        },
        {
          paso: 3,
          titulo: "Si nutrición >6 semanas",
          descripcion: "Gastrostomía endoscópica percutánea (PEG) o quirúrgica. Si reflujo severo o gastroparesia: yeyunostomía",
          farmacos: []
        },
        {
          paso: 4,
          titulo: "Seguimiento y cuidados",
          descripcion: "Educación familiar, prevención de complicaciones, ajuste de fórmula",
          farmacos: []
        }
      ]
    },
    {
      nombre: "Escalera Terapéutica para Irritabilidad",
      objetivo: "Manejo escalonado de irritabilidad refractaria en pacientes neurológicos",
      poblacion: "Niños con encefalopatología grave y episodios de irritabilidad",
      pasos: [
        {
          paso: 1,
          titulo: "Primera línea: Gabapentinoides",
          descripcion: "Gabapentina (titular hasta 45-60mg/kg/día) o Pregabalina (5-10mg/kg/día)",
          farmacos: ["Gabapentina", "Pregabalina"]
        },
        {
          paso: 2,
          titulo: "Segunda línea: Moduladores SNC",
          descripcion: "Añadir Amitriptilina o Clonidina (especialmente si disautonomía)",
          farmacos: ["Amitriptilina", "Clonidina"]
        },
        {
          paso: 3,
          titulo: "Tercera línea: Metadona",
          descripcion: "Metadona 30-100mcg/kg 1-3 veces/día (requiere experiencia)",
          farmacos: ["Metadona"]
        },
        {
          paso: 4,
          titulo: "Coadyuvantes en cualquier escalón",
          descripcion: "Opioides (si dolor), Haloperidol, Benzodiacepinas según síntomas asociados",
          farmacos: ["Morfina", "Haloperidol", "Midazolam"]
        }
      ]
    },
    {
      nombre: "Actuación ante Emergencia en Niño Traqueotomizado",
      objetivo: "Manejo sistemático de complicaciones agudas de traqueostomía",
      poblacion: "Niños portadores de traqueostomía",
      pasos: [
        {
          paso: 1,
          titulo: "Valoración rápida: desaturación o dificultad respiratoria",
          descripcion: "Comprobar permeabilidad de la cánula, descartar obstrucción por tapón mucoso",
          farmacos: []
        },
        {
          paso: 2,
          titulo: "Aspiración de secreciones",
          descripcion: "Aspiración suave por traqueostomía. Si no mejora: cambio de cánula",
          farmacos: []
        },
        {
          paso: 3,
          titulo: "Si no resuelve: retirar cánula y ventilar",
          descripcion: "Retirar cánula, ventilar por estoma traqueal con ambulón adaptado o por boca/nariz",
          farmacos: []
        },
        {
          paso: 4,
          titulo: "Recolocar cánula",
          descripcion: "Insertar nueva cánula (mismo tamaño o 0.5 menor si dificultad). Verificar posición",
          farmacos: []
        }
      ]
    },
    {
      nombre: "Manejo de Sospecha de Infección Relacionada con Catéter",
      objetivo: "Identificación y tratamiento de infección de catéter venoso central",
      poblacion: "Niños con catéter venoso central y signos de infección",
      pasos: [
        {
          paso: 1,
          titulo: "Valoración clínica",
          descripcion: "Fiebre, signos locales en punto de inserción, bacteriemia sin otro foco",
          farmacos: []
        },
        {
          paso: 2,
          titulo: "Extracción de hemocultivos",
          descripcion: "Hemocultivo periférico + hemocultivo por catéter antes de iniciar antibiótico",
          farmacos: []
        },
        {
          paso: 3,
          titulo: "Antibioterapia empírica",
          descripcion: "Vancomicina + Gentamicina o Ceftazidima según sospecha. Ajustar según antibiograma",
          farmacos: ["Vancomicina", "Gentamicina", "Ceftazidima"]
        },
        {
          paso: 4,
          titulo: "Valorar retirada de catéter",
          descripcion: "Retirar si: shock séptico, endocarditis, infección fúngica, no respuesta a 48-72h de tratamiento",
          farmacos: []
        }
      ]
    },
    {
      nombre: "Selección de Vía de Nutrición Enteral",
      objetivo: "Elegir la vía óptima según situación clínica y duración",
      poblacion: "Niños con necesidad de soporte nutricional enteral",
      pasos: [
        {
          paso: 1,
          titulo: "¿Vía oral posible?",
          descripcion: "Valorar deglución segura. Si sí: espesantes, adaptar texturas. Si no: nutrición enteral por sonda",
          farmacos: []
        },
        {
          paso: 2,
          titulo: "Duración estimada <6 semanas",
          descripcion: "Sonda nasogástrica (SNG) o nasoyeyunal (SNY) si reflujo severo",
          farmacos: []
        },
        {
          paso: 3,
          titulo: "Duración estimada >6 semanas",
          descripcion: "Gastrostomía (PEG o quirúrgica). Yeyunostomía si RGE severo o gastroparesia",
          farmacos: []
        },
        {
          paso: 4,
          titulo: "Si tracto GI no funcional",
          descripcion: "Nutrición parenteral (central si >2 semanas, periférica si <2 semanas)",
          farmacos: []
        }
      ]
    },
    {
      nombre: "Selección de Fórmula de Nutrición Enteral (< 1 año)",
      objetivo: "Elegir fórmula nutricional adecuada en lactantes",
      poblacion: "Lactantes <1 año con nutrición enteral",
      pasos: [
        {
          paso: 1,
          titulo: "Primera elección: leche materna",
          descripcion: "Leche materna extraída siempre que sea posible",
          farmacos: []
        },
        {
          paso: 2,
          titulo: "Si no LM: fórmula estándar",
          descripcion: "Fórmula de inicio (0-6m) o continuación (6-12m) según edad",
          farmacos: []
        },
        {
          paso: 3,
          titulo: "Si intolerancia o necesidades especiales",
          descripcion: "Hidrolizado (alergia), sin lactosa (intolerancia), hipercalórica (desnutrición)",
          farmacos: []
        },
        {
          paso: 4,
          titulo: "Monitorización",
          descripcion: "Peso, talla, tolerancia digestiva, ajuste caloricó/proteico según evolución",
          farmacos: []
        }
      ]
    },
    {
      nombre: "Selección de Fórmula de Nutrición Enteral (> 1 año)",
      objetivo: "Elegir fórmula nutricional adecuada en niños mayores",
      poblacion: "Niños >1 año con nutrición enteral",
      pasos: [
        {
          paso: 1,
          titulo: "Valorar estado nutricional",
          descripcion: "Normonutrido: fórmula normocalórica. Desnutrido: fórmula hipercalórica",
          farmacos: []
        },
        {
          paso: 2,
          titulo: "Fórmula polimérica estándar",
          descripcion: "Primera elección si función digestiva conservada",
          farmacos: []
        },
        {
          paso: 3,
          titulo: "Fórmulas especiales según patología",
          descripcion: "Oligomérica (malabsorción), con fibra (estreñimiento), específica de patología",
          farmacos: []
        },
        {
          paso: 4,
          titulo: "Monitorización y ajuste",
          descripcion: "Valorar tolerancia, estado nutricional, ajustar volumen y aporte calórico",
          farmacos: []
        }
      ]
    },
    {
      nombre: "Evaluación Nutricional en Enfermedad Neurológica",
      objetivo: "Detección precoz de malnutrición en niños con enfermedad neurológica",
      poblacion: "Niños con parálisis cerebral, enfermedades neurodegenerativas o neurometabólicas",
      pasos: [
        {
          paso: 1,
          titulo: "Valoración antropométrica",
          descripcion: "Peso, talla, IMC, perímetro braquial, pliegues cutáneos. Usar curvas específicas (ej: PC)",
          farmacos: []
        },
        {
          paso: 2,
          titulo: "Valoración funcional",
          descripcion: "Capacidad de deglución, tiempo de ingesta, vómitos, RGE, estreñimiento",
          farmacos: []
        },
        {
          paso: 3,
          titulo: "Valoración bioquímica",
          descripcion: "Hemograma, proteínas, prealbumina, vitaminas, minerales según clínica",
          farmacos: []
        },
        {
          paso: 4,
          titulo: "Plan nutricional individualizado",
          descripcion: "Ajustar textura, vía, aporte calórico-proteico, suplementación. Revisión periódica",
          farmacos: []
        }
      ]
    },
    {
      nombre: "Manejo del Prurito",
      objetivo: "Tratamiento sistemático del prurito en cuidados paliativos",
      poblacion: "Niños con prurito de diversas etiologías",
      pasos: [
        {
          paso: 1,
          titulo: "Medidas generales",
          descripcion: "Hidratación cutánea, evitar irritantes, uñas cortas, ambiente fresco",
          farmacos: []
        },
        {
          paso: 2,
          titulo: "Tratamiento tópico",
          descripcion: "Emolientes, lociones de calamina, corticoides tópicos si inflamación",
          farmacos: ["Corticoides tópicos"]
        },
        {
          paso: 3,
          titulo: "Tratamiento sistémico primera línea",
          descripcion: "Antihistamínicos: Hidroxizina, Cetirizina. Si colestasis: Colestiramina, Rifampicina",
          farmacos: ["Hidroxizina", "Cetirizina", "Colestiramina", "Rifampicina"]
        },
        {
          paso: 4,
          titulo: "Tratamiento refractario",
          descripcion: "Gabapentina, Pregabalina, Ondansetrón. Valorar causa tratable (infección, alergia)",
          farmacos: ["Gabapentina", "Pregabalina", "Ondansetrón"]
        }
      ]
    },
    {
      nombre: "Circuito de Gestión de Incidentes de Seguridad",
      objetivo: "Notificación y análisis de eventos adversos para mejora continua",
      poblacion: "Todos los pacientes en cuidados paliativos",
      pasos: [
        {
          paso: 1,
          titulo: "Detección del incidente",
          descripcion: "Identificación por cualquier miembro del equipo de evento adverso o cuasi-evento",
          farmacos: []
        },
        {
          paso: 2,
          titulo: "Notificación inmediata",
          descripcion: "Comunicación al responsable del equipo y registro en sistema de notificación",
          farmacos: []
        },
        {
          paso: 3,
          titulo: "Análisis de causas",
          descripcion: "Revisión multidisciplinar, identificación de causas raíz, no culpabilización",
          farmacos: []
        },
        {
          paso: 4,
          titulo: "Plan de acción y seguimiento",
          descripcion: "Medidas correctoras, difusión de aprendizaje, monitorización de efectividad",
          farmacos: []
        }
      ]
    },
    {
      nombre: "Abordaje de la Disfagia Orofaríngea en Cuidados Paliativos",
      objetivo: "Manejo seguro de la disfagia minimizando riesgo de aspiración",
      poblacion: "Niños con disfagia orofaríngea",
      pasos: [
        {
          paso: 1,
          titulo: "Valoración de la deglución",
          descripcion: "Exploración clínica, test de deglución, videofluoroscopia si disponible",
          farmacos: []
        },
        {
          paso: 2,
          titulo: "Adaptación de texturas",
          descripcion: "Espesantes para líquidos, modificación de consistencia de sólidos según tolerancia",
          farmacos: []
        },
        {
          paso: 3,
          titulo: "Medidas posturales y técnicas",
          descripcion: "Posición semiincorporada, flexión cervical, degluciones múltiples, pequeños volúmenes",
          farmacos: []
        },
        {
          paso: 4,
          titulo: "Valorar nutrición enteral",
          descripcion: "Si aspiración recurrente o ingesta insuficiente: SNG o gastrostomía",
          farmacos: []
        }
      ]
    },
    {
      nombre: "Manejo del Estatus Epiléptico Convulsivo",
      objetivo: "Tratamiento secuencial del estatus epiléptico",
      poblacion: "Niños con crisis convulsivas >5 minutos o crisis recurrentes sin recuperación",
      pasos: [
        {
          paso: 1,
          titulo: "0-5 min: Medidas generales",
          descripcion: "Vía aérea, posición lateral, oxígeno, monitor, glucemia",
          farmacos: []
        },
        {
          paso: 2,
          titulo: "5-10 min: Benzodiacepina",
          descripcion: "Midazolam bucal 200-300mcg/kg o Diazepam rectal 0.5mg/kg. Repetir 1 vez si no cede",
          farmacos: ["Midazolam", "Diazepam"]
        },
        {
          paso: 3,
          titulo: "10-20 min: Fármaco antiepiléptico IV",
          descripcion: "Levetiracetam 40mg/kg IV, Fenitoina 20mg/kg IV, o Valproato 40mg/kg IV",
          farmacos: ["Levetiracetam", "Fenitoina", "Valproato"]
        },
        {
          paso: 4,
          titulo: ">20 min: Estatus refractario",
          descripcion: "Midazolam perfusión 200mcg/kg bolus + 1-5mcg/kg/min. Considerar intubación y UCI",
          farmacos: ["Midazolam perfusión"]
        }
      ]
    },
    {
      nombre: "Manejo del Estatus Epiléptico en Situación de Final de Vida",
      objetivo: "Control de crisis convulsivas priorizando confort en final de vida",
      poblacion: "Niños en situación terminal con crisis convulsivas",
      pasos: [
        {
          paso: 1,
          titulo: "Valoración de objetivos terapéuticos",
          descripcion: "Consenso con familia: prioridad es confort, evitar sufrimiento",
          farmacos: []
        },
        {
          paso: 2,
          titulo: "Tratamiento de crisis",
          descripcion: "Midazolam bucal 200-300mcg/kg o SC 25-50mcg/kg. Repetir si precisa",
          farmacos: ["Midazolam"]
        },
        {
          paso: 3,
          titulo: "Si crisis recurrentes",
          descripcion: "Midazolam perfusión SC 50-300mcg/kg/h. Titular según respuesta",
          farmacos: ["Midazolam perfusión"]
        },
        {
          paso: 4,
          titulo: "Sedación paliativa si refractario",
          descripcion: "Aumentar Midazolam hasta control de síntomas. Añadir Morfina si dolor",
          farmacos: ["Midazolam", "Morfina"]
        }
      ]
    },
    {
      nombre: "Algoritmo de Manejo del Reflujo Gastroesofágico",
      objetivo: "Tratamiento escalonado del RGE en niños con patología neurológica",
      poblacion: "Niños con RGE, especialmente con discapacidad neurológica",
      pasos: [
        {
          paso: 1,
          titulo: "Medidas posturales y dietéticas",
          descripcion: "Elevación cabecera 30º, espesar alimentos, tomas pequeñas frecuentes",
          farmacos: []
        },
        {
          paso: 2,
          titulo: "Tratamiento farmacológico",
          descripcion: "Omeprazol 1-2mg/kg/día. Añadir Domperidona o Metoclopramida si gastroparesia",
          farmacos: ["Omeprazol", "Domperidona", "Metoclopramida"]
        },
        {
          paso: 3,
          titulo: "Valorar nutrición enteral postpilórica",
          descripcion: "Si RGE severo con aspiración: considerar sonda nasoyeyunal o yeyunostomía",
          farmacos: []
        },
        {
          paso: 4,
          titulo: "Cirugía antirreflujo",
          descripcion: "Funduplicatura de Nissen si: RGE refractario, aspiraciones recurrentes, esofagitis severa",
          farmacos: []
        }
      ]
    },
    {
      nombre: "Manejo de Dolor Neuropático Refractario",
      pasos: [
        {
          paso: 1,
          titulo: "Primera línea: Gabapentinoides",
          descripcion: "Iniciar gabapentina o pregabalina con titulación gradual",
          farmacos: ["Gabapentina", "Pregabalina"]
        },
        {
          paso: 2,
          titulo: "Segunda línea: Moduladores SNC",
          descripcion: "Si no respuesta: añadir antidepresivo tricíclico o clonidina (especialmente si disautonomía)",
          farmacos: ["Amitriptilina", "Clonidina"]
        },
        {
          paso: 3,
          titulo: "Tercera línea: Metadona",
          descripcion: "Si irritabilidad refractaria, considerar metadona (requiere experiencia)",
          farmacos: ["Metadona"]
        },
        {
          paso: 4,
          titulo: "Coadyuvantes",
          descripcion: "En cualquier escalón pueden añadirse: opioides (si dolor), neurolépticos, benzodiacepinas",
          farmacos: ["Morfina", "Haloperidol", "Midazolam"]
        }
      ]
    },
    {
      nombre: "Tratamiento de Crisis Disautonómicas",
      objetivo: "Control de episodios de hiperactividad simpática",
      poblacion: "Niños con daño cerebral grave, TCE, enfermedades neurodegenerativas",
      pasos: [
        {
          paso: 1,
          titulo: "Control del dolor",
          descripcion: "Identificar y tratar dolor (principal desencadenante). Usar opioides si precisa",
          farmacos: ["Morfina", "Fentanilo"]
        },
        {
          paso: 2,
          titulo: "Modulación autonómica",
          descripcion: "Añadir clonidina (agonista α2) y/o propranolol (β-bloqueante)",
          farmacos: ["Clonidina", "Propranolol"]
        },
        {
          paso: 3,
          titulo: "Modulación central",
          descripcion: "Gabapentina para modular hiperexcitabilidad del SNC",
          farmacos: ["Gabapentina"]
        },
        {
          paso: 4,
          titulo: "Sedación si precisa",
          descripcion: "Si crisis graves: benzodiacepinas o sedación paliativa",
          farmacos: ["Midazolam", "Diazepam"]
        }
      ]
    },
    {
      nombre: "Tratamiento Farmacológico Avanzado de Espasticidad",
      objetivo: "Manejo de espasticidad generalizada refractaria",
      poblacion: "Niños con espasticidad severa no controlada con tratamiento oral",
      pasos: [
        {
          paso: 1,
          titulo: "Medidas no farmacológicas",
          descripcion: "Fisioterapia, estiramientos, posicionamiento, órtesis",
          farmacos: []
        },
        {
          paso: 2,
          titulo: "Tratamiento oral",
          descripcion: "Baclofeno oral como primera línea farmacológica",
          farmacos: ["Baclofeno"]
        },
        {
          paso: 3,
          titulo: "Tratamiento focal",
          descripcion: "Si espasticidad focal: toxina botulínica intramuscular",
          farmacos: ["Toxina botulínica"]
        },
        {
          paso: 4,
          titulo: "Tratamiento avanzado",
          descripcion: "Si refractaria: baclofeno intratecal mediante bomba programable",
          farmacos: ["Baclofeno intratecal"]
        }
      ]
    }
  ],
  algoritmos_custom: [],
  protocolos: [
    {
      nombre: "Manejo sintomático al final de la vida",
      url: "https://www.pedpal.es/protocolos/manejo-sintomatico-al-final-de-la-vida",
      sintomas: ["dolor", "disnea", "estertores", "astenia", "anorexia", "náuseas", "vómitos", "estreñimiento", "fiebre", "agitación", "delirium", "convulsiones", "hemorragias"],
      descripcion: "Protocolo integral para el manejo de síntomas en situación de últimos días"
    },
    {
      nombre: "Irritabilidad y agitación",
      url: "https://www.pedpal.es/protocolos/irritabilidad-y-agitacion",
      sintomas: ["irritabilidad", "agitación", "dolor_neuropatico", "hiperalgesia_visceral"],
      enfermedades: ["trastornos_neurologicos_graves", "encefalopatia", "daño_cerebral"],
      descripcion: "Manejo de irritabilidad y agitación en pacientes con déficit neurológico"
    },
    {
      nombre: "Dolor en CPP - Generalidades",
      url: "https://www.pedpal.es/protocolos/dolor-cpp",
      sintomas: ["dolor_nociceptivo", "dolor_neuropatico", "dolor_mixto"],
      enfermedades: ["cancer_infantil", "paralisis_cerebral", "enfermedades_neuromusculares", "VIH_SIDA"],
      descripcion: "Clasificación, causas y tratamiento multimodal del dolor pediátrico"
    },
    {
      nombre: "Espasticidad",
      url: "https://www.pedpal.es/protocolos/espasticidad",
      sintomas: ["hipertonia_muscular", "espasticidad", "dolor_musculoesqueletico"],
      enfermedades: ["paralisis_cerebral", "enfermedades_neurodegenerativas", "lesion_medular"],
      descripcion: "Evaluación y tratamiento de la espasticidad en pediatría"
    },
    {
      nombre: "Crisis disautonómicas",
      url: "https://www.pedpal.es/protocolos/crisis-disautonomicas",
      sintomas: ["taquicardia", "hipertermia", "sudoracion", "alteraciones_posturales", "agitacion"],
      enfermedades: ["traumatismo_craneoencefalico", "paralisis_cerebral", "enfermedades_neurodegenerativas"],
      descripcion: "Detección y manejo de crisis disautonómicas"
    },
    {
      nombre: "Disnea y estertores",
      url: "https://www.pedpal.es/protocolos/disnea-y-estertores",
      sintomas: ["disnea", "estertores"],
      descripcion: "Manejo de síntomas respiratorios en cuidados paliativos"
    },
    {
      nombre: "Estreñimiento",
      url: "https://www.pedpal.es/protocolos/estrenimiento",
      sintomas: ["estrenimiento"],
      descripcion: "Prevención y tratamiento del estreñimiento pediátrico"
    },
    {
      nombre: "Prurito",
      url: "https://www.pedpal.es/protocolos/prurito",
      sintomas: ["prurito"],
      descripcion: "Manejo del prurito en pediatría"
    },
    {
      nombre: "Lesiones por presión",
      url: "https://www.pedpal.es/protocolos/lesiones-por-presion",
      sintomas: ["lesiones_cutaneas", "dolor_ulceras"],
      enfermedades: ["inmovilizacion_prolongada"],
      descripcion: "Prevención y tratamiento de lesiones por presión"
    },
    {
      nombre: "Problemas sistémicos",
      url: "https://www.pedpal.es/protocolos/problemas-sistemicos",
      sintomas: ["astenia", "anorexia", "caquexia", "fiebre_no_infecciosa", "diaforesis"],
      enfermedades: ["cancer", "enfermedades_cronicas_debilitantes"],
      descripcion: "Manejo de síntomas sistémicos: astenia, anorexia, caquexia, fiebre y diaforesis"
    },
    {
      nombre: "Dispositivos de soporte nutricional",
      url: "https://www.pedpal.es/protocolos/dispositivos-de-soporte-nutricional",
      sintomas: ["problemas_nutricionales", "disfagia"],
      enfermedades: ["trastornos_neuromusculares", "paralisis_cerebral", "cancer"],
      descripcion: "Guía de dispositivos de nutrición enteral en cuidados paliativos"
    },
    {
      nombre: "Nutrición enteral domiciliaria",
      url: "https://www.pedpal.es/protocolos/nutricion-enteral-domiciliaria",
      sintomas: ["problemas_nutricionales"],
      descripcion: "Manejo de nutrición enteral en domicilio"
    },
    {
      nombre: "Nutrición parenteral domiciliaria",
      url: "https://www.pedpal.es/protocolos/nutricion-parenteral-domiciliaria",
      sintomas: ["problemas_nutricionales"],
      descripcion: "Indicaciones y manejo de nutrición parenteral domiciliaria"
    },
    {
      nombre: "Problemas nutricionales y malnutrición",
      url: "https://www.pedpal.es/protocolos/problemas-nutricionales",
      sintomas: ["malnutricion", "anorexia", "caquexia"],
      descripcion: "Evaluación y manejo de problemas nutricionales"
    },
    {
      nombre: "Bases éticas de toma de decisiones",
      url: "https://www.pedpal.es/protocolos/bases-eticas",
      descripcion: "Fundamentos éticos de la toma de decisiones compartidas"
    },
    {
      nombre: "Manejo de traqueostomía en domicilio",
      url: "https://www.pedpal.es/protocolos/traqueostomia-domicilio",
      descripcion: "Cuidados de traqueostomía en el domicilio"
    },
    {
      nombre: "Cuidados paliativos neonatales - Paritorio",
      url: "https://www.pedpal.es/protocolos/cpp-neonatales-paritorio",
      enfermedades: ["patologias_neonatales_limitantes"],
      descripcion: "Atención paliativa perinatal y en paritorio"
    },
    {
      nombre: "Cuidados al final de la vida en neonatología",
      url: "https://www.pedpal.es/protocolos/final-vida-neonatologia",
      sintomas: ["dolor_neonatal", "disnea", "convulsiones", "secreciones"],
      enfermedades: ["patologias_neonatales_limitantes"],
      descripcion: "Cuidados integrales al final de la vida en neonatos"
    }
  ],
  medicamentos: [
    {
      nombre: "Morfina",
      indicaciones: ["dolor_moderado_severo", "disnea"],
      vias: ["oral", "subcutanea", "intravenosa"],
      dosisInfo: {
        oral: "0.2-0.5 mg/kg cada 4-6h",
        sc_im: "0.1-0.2 mg/kg cada 4h (máx 15mg/24h)",
        iv: "0.05-0.1 mg/kg cada 4h (máx 15mg/24h)",
        perfusion: "0.04-0.07 mg/kg/h"
      },
      presentaciones: ["Solución oral 2mg/ml", "Comprimidos 10-20mg", "Solución inyectable 1% y 2%"]
    },
    {
      nombre: "Fentanilo",
      indicaciones: ["dolor_moderado_severo", "sedoanalgesia"],
      vias: ["transdermica", "intravenosa", "intranasal"],
      dosisInfo: {
        iv_carga: "2 mcg/kg en 10 minutos",
        perfusion: "Iniciar 3 mcg/kg/h. Aumentar 1 mcg/kg/h cada 30min si precisa"
      }
    },
    {
      nombre: "Metadona",
      indicaciones: ["dolor_moderado_severo", "dolor_neuropatico", "irritabilidad_refractaria"],
      vias: ["oral", "subcutanea", "intravenosa"],
      dosisInfo: {
        ninos_1_12_anos: "30-100 mcg/kg (máx 5mg/dosis inicial) 1-3 veces/día",
        mayores_12_anos: "100-200 mcg/kg cada 8-12h (máx 5mg/dosis)"
      }
    },
    {
      nombre: "Gabapentina",
      indicaciones: ["dolor_neuropatico", "irritabilidad_cerebral", "hiperalgesia_visceral", "disfuncion_autonomica"],
      vias: ["oral"],
      dosisInfo: {
        inicio_menores_3_anos: "5 mg/kg/dosis e ir aumentando",
        inicio_3_12_anos: "Día 1: 5-10 mg/kg (máx 300mg) 1 vez/día noche. Día 2: 2 veces/día. Día 3: 3 veces/día",
        inicio_mayores_12_anos: "Día 1: 300mg noche. Día 2: 300mg 2 veces/día. Día 3: 300mg 3 veces/día. Aumentar 300mg/día cada 3-7 días",
        mantenimiento_ninos: "45-60 mg/kg/día en 3 dosis",
        mantenimiento_adultos: "Hasta 3600mg/día"
      },
      presentaciones: ["Cápsulas 100, 300, 400mg", "Comprimidos 300, 600, 800mg", "Suspensión oral 100mg/ml (FM)"]
    },
    {
      nombre: "Pregabalina",
      indicaciones: ["dolor_neuropatico"],
      vias: ["oral"],
      dosisInfo: {
        dia_1_3: "1 mg/kg 1 vez/día noche",
        dia_4_6: "1 mg/kg 2 veces/día",
        mantenimiento: "5-10 mg/kg/día",
        maxima: "6-15 mg/kg/día en 3 dosis (máx 600mg/día)"
      },
      nota: "Potencia 6 veces mayor que gabapentina. Conversión 6:1"
    },
    {
      nombre: "Midazolam",
      indicaciones: ["ansiedad", "agitacion", "disnea", "convulsiones", "sedacion_paliativa"],
      vias: ["oral", "bucal", "intranasal", "subcutanea", "intravenosa"],
      dosisInfo: {
        oral: "500 mcg/kg (máx 20mg) dosis única",
        bucal_intranasal_6m_9a: "200-300 mcg/kg (máx 5mg)",
        bucal_intranasal_10_17a: "6-7mg (10-12 años: 10mg)",
        sc_iv_1m_18a: "25-50 mcg/kg en 2-3 min. Puede aumentarse si precisa",
        perfusion_neonatos: "1 mcg/kg/min",
        perfusion_1m_18a: "50-300 mcg/kg/h"
      }
    },
    {
      nombre: "Lorazepam",
      indicaciones: ["ansiedad", "agitacion", "disnea"],
      vias: ["oral", "sublingual"],
      dosisInfo: {
        oral_menores_2a: "25 mcg/kg 2-3 veces/día",
        oral_2_5a: "500 mcg 2-3 veces/día",
        oral_6_10a: "750 mcg 3 veces/día",
        oral_11_14a: "1mg 3 veces/día",
        oral_15_18a: "1-2mg 3 veces/día",
        sublingual: "25 mcg/kg dosis única. Aumentar a 50 mcg/kg (máx 1mg) si necesario"
      }
    },
    {
      nombre: "Diazepam",
      indicaciones: ["espasticidad", "ansiedad", "convulsiones"],
      vias: ["oral", "rectal", "intravenosa"],
      dosisInfo: {
        oral_mayores_6m: "0.12-0.8 mg/kg/día dividido en 3-4 dosis",
        iv: "0.04-0.3 mg/kg/dosis cada 2-4h",
        maxima_iv: "0.6 mg/kg en 8 horas"
      }
    },
    {
      nombre: "Haloperidol",
      indicaciones: ["nauseas", "vomitos", "agitacion", "delirium"],
      vias: ["oral", "subcutanea", "intravenosa"],
      dosisInfo: {
        oral_1m_11a: "10-20 mcg/kg cada 8-12h (máx 50-60 mcg/kg/dosis)",
        oral_12_17a: "1.5mg noche, puede aumentar a 1.5mg/12h (máx 5mg/12h)",
        perfusion_sc_iv_1m_11a: "Inicial 25 mcg/kg/día (máx inicial 1.5mg/día). Máx 85 mcg/kg/día",
        perfusion_sc_iv_12_17a: "Inicial 1.5mg/día. Máx 5mg/día"
      }
    },
    {
      nombre: "Ondansetrón",
      indicaciones: ["nauseas", "vomitos"],
      vias: ["oral", "subcutanea"],
      dosisInfo: {
        todas_vias: "100 mcg/kg cada 8-12h (máx 4mg/dosis)"
      }
    },
    {
      nombre: "Baclofeno",
      indicaciones: ["espasticidad_generalizada", "dolor", "clonus", "rigidez"],
      vias: ["oral", "intratecal"],
      dosisInfo: {
        "2_7_anos": "2.5-5 mg/día en 3 tomas, aumento gradual semanal hasta máx 30mg/día",
        mayores_8_anos: "Hasta 60mg/día en 3 tomas"
      },
      presentaciones: ["Comprimidos 10 y 25mg"]
    },
    {
      nombre: "Clonidina",
      indicaciones: ["disfuncion_autonomica", "irritabilidad", "crisis_disautonomicas"],
      vias: ["oral"],
      dosisInfo: {
        dia_1_3: "0.002 mg/kg 1 vez/día noche",
        dia_4_6: "0.002 mg/kg 2 veces/día",
        dia_7_9: "0.002 mg/kg 3 veces/día",
        maxima: "0.012 mg/kg/dosis (0.6mg para ≥50kg) 3 veces/día"
      }
    },
    {
      nombre: "Amitriptilina",
      indicaciones: ["dolor_neuropatico", "hiperalgesia_visceral"],
      vias: ["oral"],
      dosisInfo: {
        "2_11_anos": "Inicial 200 mcg/kg (máx 10mg) noche. Aumentar gradualmente si precisa",
        "12_17_anos": "Inicial 10mg noche. Aumentar cada 3-5 días si precisa. Máx 75mg/día"
      }
    },
    {
      nombre: "Paracetamol",
      indicaciones: ["dolor_leve_moderado", "fiebre"],
      vias: ["oral", "rectal", "intravenosa"],
      dosisInfo: {
        rn_hasta_3m: "5-10 mg/kg cada 6-8h",
        ninos_adolescentes: "10-15 mg/kg cada 4-6h",
        maxima: "75 mg/kg/día o 4g/día"
      }
    },
    {
      nombre: "Ibuprofeno",
      indicaciones: ["dolor_leve_moderado", "inflamacion", "fiebre"],
      vias: ["oral"],
      dosisInfo: {
        pediatrica: "4-10 mg/kg cada 6-8h",
        maxima: "40 mg/kg/día"
      },
      contraindicaciones: "Trastornos coagulación, trombopenia"
    }
  ],
  sintomas_detalle: {
    dolor_nociceptivo: {
      nombre: "Dolor Nociceptivo",
      definicion: "Dolor por activación de nociceptores por lesión tisular. Bien localizado, punzante u opresivo",
      tratamiento_primera_linea: "Paracetamol, AINEs. Si moderado-severo: morfina",
      medicamentos: ["Paracetamol", "Ibuprofeno", "Morfina", "Fentanilo"]
    },
    dolor_neuropatico: {
      nombre: "Dolor Neuropático",
      definicion: "Dolor por lesión del sistema nervioso. Sensación de quemazón, hormigueo, alodinia",
      tratamiento_primera_linea: "Gabapentina. Segunda línea: Pregabalina, Amitriptilina",
      medicamentos: ["Gabapentina", "Pregabalina", "Amitriptilina", "Metadona"]
    },
    disnea: {
      nombre: "Disnea",
      definicion: "Sensación subjetiva de dificultad respiratoria",
      tratamiento_primera_linea: "Morfina (25-50% dosis para dolor). Benzodiacepinas si ansiedad asociada",
      medicamentos: ["Morfina", "Lorazepam", "Midazolam"],
      medidas_no_farmacologicas: ["Oxigenoterapia si hipoxemia", "Ventilador facial", "Posición semiincorporada"]
    },
    nauseas_vomitos: {
      nombre: "Náuseas y Vómitos",
      definicion: "Síntoma frecuente en cuidados paliativos, múltiples causas",
      tratamiento: "Antiemético según causa. Ondansetrón (1ª línea), Haloperidol, Levomepromazina",
      medicamentos: ["Ondansetrón", "Haloperidol"]
    },
    agitacion_delirium: {
      nombre: "Agitación y Delirium",
      definicion: "Estado de excitación psicológica y física. Delirium: alteración conciencia y cognición",
      tratamiento_primera_linea: "Haloperidol. Si precisa sedación: Midazolam + opioide",
      medicamentos: ["Haloperidol", "Midazolam"]
    },
    convulsiones: {
      nombre: "Convulsiones",
      definicion: "Crisis epilépticas que pueden aumentar al final de vida",
      tratamiento: "Midazolam (bucal, intranasal, IV). Si estatus: perfusión continua",
      medicamentos: ["Midazolam", "Diazepam"]
    },
    espasticidad: {
      nombre: "Espasticidad",
      definicion: "Aumento del tono muscular dependiente de velocidad. Resistencia en navaja",
      tratamiento: "Baclofeno (1ª línea oral). Toxina botulínica (focal). Fisioterapia",
      medicamentos: ["Baclofeno", "Tizanidina", "Diazepam", "Toxina botulínica"]
    },
    irritabilidad: {
      nombre: "Irritabilidad",
      definicion: "Estado de ansiedad persistente en pacientes con déficit neurológico grave",
      tratamiento_escalera: "1º Gabapentinoides. 2º Antidepresivos tricíclicos/Clonidina. 3º Metadona. Coadyuvantes: opioides, neurolépticos, benzodiacepinas",
      medicamentos: ["Gabapentina", "Pregabalina", "Amitriptilina", "Clonidina", "Metadona", "Haloperidol"]
    },
    estertores: {
      nombre: "Estertores",
      definicion: "Sonidos respiratorios por acumulación de secreciones",
      tratamiento: "Anticolinérgicos: Glicopirrolato, Butilbromuro de hioscina",
      medicamentos: ["Glicopirrolato", "Butilbromuro de hioscina"]
    },
    estrenimiento: {
      nombre: "Estreñimiento",
      definicion: "Frecuente en pacientes con opioides",
      tratamiento: "Profilaxis con laxantes. Polietilenglicol, lactulosa",
      medicamentos: ["Polietilenglicol", "Lactulosa"]
    }
  },
  enfermedades_detalle: {
    paralisis_cerebral: {
      nombre: "Parálisis Cerebral Infantil (PCI)",
      sintomas_frecuentes: ["Espasticidad", "Dolor neuropático", "Dolor nociceptivo", "Problemas nutricionales", "Irritabilidad"],
      protocolos: ["Espasticidad", "Dolor en CPP", "Irritabilidad y agitación", "Dispositivos de soporte nutricional"]
    },
    cancer_infantil: {
      nombre: "Cáncer Infantil",
      sintomas_frecuentes: ["Dolor", "Astenia", "Anorexia-caquexia", "Náuseas-vómitos"],
      protocolos: ["Dolor en CPP", "Problemas sistémicos", "Manejo sintomático al final de la vida"]
    },
    enfermedades_neurodegenerativas: {
      nombre: "Enfermedades Neurodegenerativas",
      sintomas_frecuentes: ["Espasticidad", "Dolor", "Crisis disautonómicas", "Problemas respiratorios", "Problemas nutricionales"],
      protocolos: ["Espasticidad", "Crisis disautonómicas", "Irritabilidad y agitación", "Dispositivos de soporte nutricional"]
    },
    enfermedades_neuromusculares: {
      nombre: "Enfermedades Neuromusculares",
      sintomas_frecuentes: ["Debilidad muscular", "Problemas respiratorios", "Disfagia", "Dolor"],
      protocolos: ["Dolor en CPP", "Dispositivos de soporte nutricional", "Manejo de traqueostomía"]
    },
    traumatismo_craneoencefalico: {
      nombre: "Traumatismo Craneoencefálico",
      sintomas_frecuentes: ["Crisis disautonómicas", "Espasticidad", "Dolor", "Alteraciones conductuales"],
      protocolos: ["Crisis disautonómicas", "Espasticidad", "Irritabilidad y agitación"]
    },
    patologias_neonatales: {
      nombre: "Patologías Neonatales Limitantes",
      sintomas_frecuentes: ["Dolor", "Disnea", "Convulsiones", "Secreciones"],
      protocolos: ["Cuidados paliativos neonatales", "Cuidados al final de la vida en neonatología"]
    }
  },
  tarjetas: [
    {
      id: 1,
      tipo: "sintoma",
      pregunta: "¿Cómo se maneja el DOLOR NOCICEPTIVO en pediatría?",
      respuesta: "<strong>Definición:</strong> Dolor por activación de nociceptores. Bien localizado, tipo opresivo/punzante.<br><br><strong>Tratamiento:</strong><br>• Dolor leve: Paracetamol 10-15mg/kg/4-6h, Ibuprofeno 4-10mg/kg/6-8h<br>• Dolor moderado-severo: MORFINA<br>&nbsp;&nbsp;- Oral: 0.2-0.5mg/kg/4-6h<br>&nbsp;&nbsp;- IV/SC: 0.05-0.2mg/kg/4h<br><br><strong>Protocolo:</strong> Generalidades del dolor en CPP"
    },
    {
      id: 2,
      tipo: "sintoma",
      pregunta: "¿Cuál es el tratamiento de primera línea para DOLOR NEUROPÁTICO?",
      respuesta: "<strong>1ª línea: GABAPENTINA</strong><br>• Día 1: 5-10mg/kg noche (máx 300mg)<br>• Día 2: 5-10mg/kg 2 veces/día<br>• Día 3: 5-10mg/kg 3 veces/día<br>• Mantenimiento: 45-60mg/kg/día<br><br><strong>Alternativas:</strong><br>• Pregabalina (potencia 6x mayor)<br>• Amitriptilina (si hiperalgesia visceral)<br><br><strong>Protocolo:</strong> Irritabilidad y agitación, Dolor en CPP"
    },
    {
      id: 3,
      tipo: "sintoma",
      pregunta: "¿Cómo controlar la DISNEA en cuidados paliativos?",
      respuesta: "<strong>Fármaco de elección: MORFINA</strong><br>• Dosis: 25-50% de la dosis para dolor<br>• Sin techo analgésico<br>• Dosis rescate: 1/6 dosis diaria total<br><br><strong>Coadyuvantes:</strong><br>• Lorazepam/Midazolam si ansiedad<br>• O2 si hipoxemia<br><br><strong>Protocolo:</strong> Disnea y estertores, Manejo sintomático final vida"
    },
    {
      id: 4,
      tipo: "sintoma",
      pregunta: "¿Tratamiento de NÁUSEAS/VÓMITOS en paliativos?",
      respuesta: "<strong>Primera línea: ONDANSETRÓN</strong><br>• Dosis: 100mcg/kg/8-12h (máx 4mg)<br>• Vía oral o SC<br><br><strong>Alternativas según causa:</strong><br>• Haloperidol (↑PIC, opioides)<br>• Levomepromazina (múltiples causas)<br>• Dexametasona (↑PIC)<br><br><strong>Protocolo:</strong> Manejo sintomático final vida"
    },
    {
      id: 5,
      tipo: "sintoma",
      pregunta: "¿Manejo de CRISIS CONVULSIVAS en paliativo?",
      respuesta: "<strong>Crisis aguda: MIDAZOLAM</strong><br>• Bucal/Intranasal: 200-300mcg/kg (6m-9a)<br>• IV/SC: 25-50mcg/kg en 2-3min<br><br><strong>Estatus epiléptico:</strong><br>• Perfusión continua 50-300mcg/kg/h<br><br><strong>Protocolo:</strong> Manejo sintomático final vida"
    },
    {
      id: 6,
      tipo: "sintoma",
      pregunta: "¿Tratamiento de ESPASTICIDAD generalizada?",
      respuesta: "<strong>Fármaco de elección: BACLOFENO oral</strong><br>• 2-7 años: Inicio 2.5-5mg/día en 3 tomas<br>&nbsp;&nbsp;Máximo: 30mg/día<br>• >8 años: Hasta 60mg/día<br><br><strong>Alternativas:</strong><br>• Tizanidina<br>• Benzodiacepinas (Diazepam)<br>• Toxina botulínica (espasticidad focal)<br><br><strong>Protocolo:</strong> Espasticidad"
    },
    {
      id: 7,
      tipo: "sintoma",
      pregunta: "¿Cómo manejar la IRRITABILIDAD en paciente neurológico?",
      respuesta: "<strong>Escalera terapéutica:</strong><br>1. <strong>Gabapentinoides:</strong> Gabapentina/Pregabalina<br>2. <strong>Antidepresivos tricíclicos:</strong> Amitriptilina<br>&nbsp;&nbsp;&nbsp;O <strong>Clonidina</strong> (si disautonomía)<br>3. <strong>Metadona</strong><br><br><strong>Coadyuvantes:</strong> Opioides, Haloperidol, Benzodiacepinas<br><br><strong>Protocolo:</strong> Irritabilidad y agitación"
    },
    {
      id: 8,
      tipo: "sintoma",
      pregunta: "¿Tratamiento de CRISIS DISAUTONÓMICAS?",
      respuesta: "<strong>Control del dolor (principal desencadenante)</strong><br><br><strong>Fármacos:</strong><br>• Morfina (si dolor)<br>• Clonidina: 0.002mg/kg, titular cada 2-3 días<br>• Propranolol (β-bloqueante)<br>• Gabapentina<br><br><strong>Protocolo:</strong> Crisis disautonómicas"
    },
    {
      id: 9,
      tipo: "sintoma",
      pregunta: "¿Manejo de AGITACIÓN/DELIRIUM terminal?",
      respuesta: "<strong>Primera línea: HALOPERIDOL</strong><br>• 1m-11a: 10-20mcg/kg/8-12h VO<br>• 12-17a: 1.5mg/8h VO<br><br><strong>Si precisa sedación:</strong><br>• Midazolam + opioide<br>• Levomepromazina (perfil más sedante)<br><br><strong>Protocolo:</strong> Manejo sintomático final vida"
    },
    {
      id: 10,
      tipo: "sintoma",
      pregunta: "¿Control de ESTERTORES en fase final?",
      respuesta: "<strong>Anticolinérgicos:</strong><br>• Glicopirrolato (preferido)<br>• Butilbromuro de hioscina<br>• Atropina gotas oftálmicas sublingual<br><br><strong>Medidas no farmacológicas:</strong><br>• Posición lateral<br>• NO aspirar (no mejora, incomoda)<br><br><strong>Protocolo:</strong> Disnea y estertores"
    },
    {
      id: 11,
      tipo: "enfermedad",
      pregunta: "PARÁLISIS CEREBRAL INFANTIL: ¿Síntomas y manejo principal?",
      respuesta: "<strong>Síntomas más frecuentes:</strong><br>• Espasticidad (70% pacientes CPP)<br>• Dolor neuropático y nociceptivo<br>• Irritabilidad<br>• Problemas nutricionales<br><br><strong>Manejo:</strong><br>• Espasticidad: Baclofeno, fisioterapia, toxina botulínica<br>• Dolor neuropático: Gabapentina<br>• Nutrición: Dispositivos soporte nutricional<br><br><strong>Protocolos:</strong> Espasticidad, Dolor CPP, Irritabilidad"
    },
    {
      id: 12,
      tipo: "enfermedad",
      pregunta: "CÁNCER INFANTIL: ¿Síntomas paliativos principales?",
      respuesta: "<strong>Síntomas más frecuentes final vida:</strong><br>1. Astenia (más frecuente)<br>2. Anorexia-caquexia (71-100%)<br>3. Dolor (85%)<br>4. Náuseas/vómitos<br>5. Disnea<br><br><strong>Manejo:</strong><br>• Astenia: Metilfenidato, corticoides (si <4 semanas vida)<br>• Dolor: Morfina (escalera analgésica)<br>• Anorexia: Acetato de megestrol<br><br><strong>Protocolos:</strong> Problemas sistémicos, Dolor CPP"
    },
    {
      id: 13,
      tipo: "enfermedad",
      pregunta: "ENFERMEDADES NEURODEGENERATIVAS: ¿Principales complicaciones?",
      respuesta: "<strong>Complicaciones frecuentes:</strong><br>• Espasticidad progresiva<br>• Crisis disautonómicas<br>• Problemas respiratorios<br>• Desnutrición<br>• Dolor mixto<br><br><strong>Manejo integral:</strong><br>• Fisioterapia + Baclofeno<br>• Control crisis disautonómicas: Clonidina, Gabapentina<br>• Soporte nutricional: SNG/GEP<br><br><strong>Protocolos:</strong> Crisis disautonómicas, Espasticidad"
    },
    {
      id: 14,
      tipo: "enfermedad",
      pregunta: "NEONATO PALIATIVO: ¿Cuidados esenciales?",
      respuesta: "<strong>Valoración dolor: Escala N-PASS</strong><br><br><strong>Sedoanalgesia:</strong><br>• Fentanilo: 2mcg/kg carga, perfusión 3mcg/kg/h<br>• Midazolam: 1mcg/kg/min (neonatos)<br><br><strong>Medidas:</strong><br>• Confort: piel con piel, lactancia materna<br>• Evitar procedimientos innecesarios<br>• Ambiente íntimo y respetuoso<br><br><strong>Protocolo:</strong> Cuidados final vida neonatología"
    },
    {
      id: 15,
      tipo: "enfermedad",
      pregunta: "TRAUMATISMO CRANEOENCEFÁLICO: ¿Complicación tardía principal?",
      respuesta: "<strong>CRISIS DISAUTONÓMICAS</strong><br><br><strong>Manifestaciones:</strong><br>• Taquicardia, HTA<br>• Hipertermia, sudoración<br>• Posturas distónicas<br>• Agitación<br><br><strong>Tratamiento:</strong><br>• Control dolor: Morfina<br>• Modulación SNA: Clonidina, Propranolol<br>• Gabapentina<br><br><strong>Protocolo:</strong> Crisis disautonómicas"
    }
  ]
};

// State management
let currentFlashcardMode = null;
let currentFlashcardIndex = 0;
let flashcardFlipped = false;
let filteredFlashcards = [];
let allFlashcards = [];
let currentFlashcardFilter = 'all';
let searchTimeout = null;
let currentView = 'sintomas';

// Initialize app
function init() {
  generateFlashcards();
  renderSintomas();
  renderFarmacos();
  renderAlgoritmos();
  renderFavoritos();
  renderTarjetas();
  setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
  // Mobile header scroll behavior
  setupMobileScrollBehavior();
  
  // Mobile menu toggle
  setupMobileMenu();
  
  // Navigation tabs
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const viewName = tab.dataset.view;
      switchView(viewName);
    });
  });

  // Global search
  const searchInput = document.getElementById('globalSearch');
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      performSearch(e.target.value);
    }, 300);
  });
  
  // Protocol button (desktop)
  const protocolBtnDesktop = document.getElementById('protocolBtnDesktop');
  if (protocolBtnDesktop) {
    protocolBtnDesktop.addEventListener('click', (e) => {
      e.preventDefault();
      window.open('https://anavarromingo-cmyk.github.io/pedpal-protocols-library/', '_blank');
    });
  }

  // Close modal on outside click
  document.getElementById('detailModal').addEventListener('click', (e) => {
    if (e.target.id === 'detailModal') {
      closeModal();
    }
  });

  // Flashcard filters
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFlashcardFilter = btn.dataset.filter;
      filterFlashcards();
    });
  });
}

// Setup mobile menu
function setupMobileMenu() {
  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  
  if (!menuToggle || !mobileMenu) return;
  
  // Toggle menu on button click
  menuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    mobileMenu.classList.toggle('active');
    
    // Change icon
    const icon = menuToggle.querySelector('.menu-icon');
    if (mobileMenu.classList.contains('active')) {
      icon.textContent = '✕';
    } else {
      icon.textContent = '☰';
    }
  });
  
  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!mobileMenu.contains(e.target) && !menuToggle.contains(e.target)) {
      mobileMenu.classList.remove('active');
      const icon = menuToggle.querySelector('.menu-icon');
      icon.textContent = '☰';
    }
  });
  
  // Close menu on menu item click
  document.querySelectorAll('.mobile-menu-item').forEach(item => {
    item.addEventListener('click', () => {
      mobileMenu.classList.remove('active');
      const icon = menuToggle.querySelector('.menu-icon');
      icon.textContent = '☰';
    });
  });
}

// Close mobile menu function (exposed globally)
function closeMobileMenu() {
  const mobileMenu = document.getElementById('mobileMenu');
  const menuToggle = document.getElementById('menuToggle');
  if (mobileMenu) {
    mobileMenu.classList.remove('active');
  }
  if (menuToggle) {
    const icon = menuToggle.querySelector('.menu-icon');
    if (icon) icon.textContent = '☰';
  }
}

// Mobile scroll behavior for header
function setupMobileScrollBehavior() {
  if (window.innerWidth > 768) return;
  
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    
    scrollTimeout = setTimeout(() => {
      const header = document.querySelector('.header');
      const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
      
      // Only hide header when scrolling down and past initial position
      if (currentScroll > lastScrollTop && currentScroll > 100) {
        // Scrolling down
        header.classList.add('header-hidden');
      } else {
        // Scrolling up
        header.classList.remove('header-hidden');
      }
      
      lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
    }, 50);
  }, { passive: true });
  
  // Re-check on resize
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      document.querySelector('.header').classList.remove('header-hidden');
    }
  });
}

// Switch view
function switchView(viewName) {
  currentView = viewName;
  
  // Update active tab
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.classList.remove('active');
    if (tab.dataset.view === viewName) {
      tab.classList.add('active');
    }
  });

  // Update active view
  document.querySelectorAll('.view').forEach(view => {
    view.classList.remove('active');
  });
  document.getElementById(viewName).classList.add('active');
}

// Get category info
function getCategoryColor(categoria) {
  const colors = {
    dolor: '#EC008C',
    respiratorio: '#00AEEF',
    neurologico: '#8DC63F',
    gastrointestinal: '#F7941D',
    psicologico: '#4B2E1C'
  };
  return colors[categoria] || '#00AEEF';
}

function getCategoryIcon(categoria) {
  const icons = {
    dolor: '🩹',
    respiratorio: '💨',
    neurologico: '⚡',
    gastrointestinal: '🍽️',
    psicologico: '🧠'
  };
  return icons[categoria] || '📋';
}

// Toggle favorite
function toggleFavorite(type, id) {
  const index = favorites[type].indexOf(id);
  if (index > -1) {
    favorites[type].splice(index, 1);
  } else {
    favorites[type].push(id);
  }
  
  // Update UI
  const btn = event.target;
  btn.classList.toggle('active');
  btn.textContent = btn.classList.contains('active') ? '⭐' : '☆';
  
  renderFavoritos();
  event.stopPropagation();
}

// Render Sintomas
function renderSintomas() {
  const grid = document.getElementById('sintomasGrid');
  const sintomas = data.sintomas_json;
  
  grid.innerHTML = sintomas.map((sintoma, index) => {
    const color = getCategoryColor(sintoma.categoria);
    const icon = getCategoryIcon(sintoma.categoria);
    const isFavorite = favorites.sintomas.includes(index);
    
    return `
      <div class="card card-border-${sintoma.categoria}" data-type="sintoma" data-index="${index}" style="border-left-color: ${color};" onclick="toggleCard(this)">
        <div class="card-header-row">
          <h3 class="card-title">${icon} ${sintoma.nombre}</h3>
          <button class="favorite-btn ${isFavorite ? 'active' : ''}" onclick="toggleFavorite('sintomas', ${index})">${isFavorite ? '⭐' : '☆'}</button>
        </div>
        <p class="card-meta">${sintoma.descripcion}</p>
        <div class="card-expanded">
          <div class="section-box">
            <h4>Manejo No Farmacológico</h4>
            <ul style="margin: 0; padding-left: 20px;">
              ${sintoma.manejo_no_farmacologico.map(m => `<li>${m}</li>`).join('')}
            </ul>
          </div>
          
          <div class="section-box">
            <h4>Manejo Farmacológico</h4>
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Fármaco</th>
                    <th>Dosis</th>
                    <th>Vía(s)</th>
                    <th>Nota(s)</th>
                  </tr>
                </thead>
                <tbody>
                  ${sintoma.manejo_farmacologico.map(f => `
                    <tr>
                      <td><strong>${f.farmaco}</strong></td>
                      <td>${f.dosis}</td>
                      <td>${f.via}</td>
                      <td>${f.notas}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
          
          ${sintoma.algoritmo ? `
            <button class="btn" style="margin-top: 16px; width: 100%;" onclick="viewRelatedAlgorithm('${sintoma.nombre.replace(/'/g, "\\'")}')); event.stopPropagation();">
              Ver Algoritmo de Tratamiento →
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// Render Farmacos
function renderFarmacos() {
  const grid = document.getElementById('farmacosGrid');
  const farmacos = data.farmacos_json;
  
  grid.innerHTML = farmacos.map((farmaco, index) => {
    const isFavorite = favorites.farmacos.includes(index);
    
    return `
      <div class="card card-border-left" data-type="farmaco" data-index="${index}" onclick="showFarmacoDetail(${index})">
        <div class="card-header-row">
          <h3 class="card-title">💊 ${farmaco.nombre}</h3>
          <button class="favorite-btn ${isFavorite ? 'active' : ''}" onclick="toggleFavorite('farmacos', ${index})">${isFavorite ? '⭐' : '☆'}</button>
        </div>
        <p class="card-meta">${farmaco.categoria}</p>
        <div style="margin-top: 12px;">
          ${farmaco.usos.slice(0, 3).map(uso => `<span class="badge badge-success">${uso}</span>`).join('')}
        </div>
        <div style="margin-top: 12px;">
          ${farmaco.vias.map(via => `<span class="route-badge">${via}</span>`).join('')}
        </div>
      </div>
    `;
  }).join('');
}

// Show farmaco detail
function showFarmacoDetail(index) {
  if (event.target.classList.contains('favorite-btn')) return;
  
  const farmaco = data.farmacos_json[index];
  const modal = document.getElementById('detailModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalContent = document.getElementById('modalContent');
  
  modalTitle.textContent = farmaco.nombre;
  
  let dosisHTML = '<div class="section-box"><h4>Dosificación</h4>';
  Object.entries(farmaco.dosis).forEach(([key, value]) => {
    const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    dosisHTML += `<p><strong>${label}:</strong> ${value}</p>`;
  });
  dosisHTML += '</div>';
  
  modalContent.innerHTML = `
    <div class="section-box">
      <h4>Categoría</h4>
      <p>${farmaco.categoria}</p>
    </div>
    
    <div class="section-box">
      <h4>Usos Principales</h4>
      <div>
        ${farmaco.usos.map(uso => `<span class="badge badge-success">${uso}</span>`).join('')}
      </div>
    </div>
    
    <div class="section-box">
      <h4>Vías de Administración</h4>
      <div>
        ${farmaco.vias.map(via => `<span class="route-badge">${via}</span>`).join('')}
      </div>
    </div>
    
    ${dosisHTML}
    
    ${farmaco.presentaciones ? `
      <div class="section-box">
        <h4>Presentaciones</h4>
        <ul style="margin: 0; padding-left: 20px;">
          ${farmaco.presentaciones.map(p => `<li>${p}</li>`).join('')}
        </ul>
      </div>
    ` : ''}
    
    ${farmaco.notas ? `
      <div class="warning-box">
        <strong>ℹ️ Notas importantes:</strong><br>
        ${farmaco.notas}
      </div>
    ` : ''}
  `;
  
  modal.classList.add('active');
}

// Function to view related algorithm from symptom
function viewRelatedAlgorithm(sintomaName) {
  // Switch to algorithms tab
  switchView('algoritmos');
  
  // Wait for view to render, then find and scroll to algorithm
  setTimeout(() => {
    const algoritmoName = mapeoSintomaAlgoritmo[sintomaName];
    
    if (algoritmoName) {
      // Find the algorithm container
      const containers = document.querySelectorAll('.algorithm-container');
      let found = false;
      
      containers.forEach(container => {
        const title = container.querySelector('.algorithm-title');
        if (title && title.textContent.includes(algoritmoName)) {
          found = true;
          
          // Scroll to algorithm with offset for header
          setTimeout(() => {
            const headerHeight = document.querySelector('.header').offsetHeight;
            const containerTop = container.getBoundingClientRect().top + window.pageYOffset;
            window.scrollTo({
              top: containerTop - headerHeight - 20,
              behavior: 'smooth'
            });
            
            // Highlight the algorithm
            container.style.transition = 'background-color 0.3s ease';
            container.style.backgroundColor = 'var(--color-bg-1)';
            container.style.border = '2px solid var(--pedpal-azul)';
            
            setTimeout(() => {
              container.style.backgroundColor = '';
              container.style.border = '1px solid var(--color-card-border)';
            }, 2500);
          }, 100);
        }
      });
      
      if (!found) {
        console.warn(`Algorithm not found: ${algoritmoName}`);
      }
    } else {
      console.warn(`No algorithm mapping for symptom: ${sintomaName}`);
    }
  }, 200);
}

// Render Algoritmos
function renderAlgoritmos() {
  const container = document.getElementById('algoritmosContainer');
  // Use all algorithms: custom + predefined
  const algoritmos = [...data.algoritmos_predefinidos, ...(data.algoritmos_custom || [])];
  
  if (!algoritmos || algoritmos.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: var(--space-32); text-align: center;">
        <div class="empty-state-icon" style="font-size: 64px; margin-bottom: var(--space-24);">📊</div>
        <h3 style="font-size: var(--font-size-2xl); margin-bottom: var(--space-12); color: var(--color-text);">Próximamente...</h3>
        <p style="color: var(--color-text-secondary); font-size: var(--font-size-lg);">Algoritmos clínicos interactivos</p>
        <p style="color: var(--color-text-secondary); font-size: var(--font-size-sm); margin-top: var(--space-16);">Esta sección se actualizará automáticamente cuando se carguen nuevos algoritmos</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = algoritmos.map((algoritmo, idx) => {
    return `
      <div class="algorithm-container" data-algorithm-id="${idx}">
        <div class="algorithm-title">
          <span>📊</span>
          <span>${algoritmo.nombre}</span>
        </div>
        ${algoritmo.objetivo ? `<p style="color: var(--color-text-secondary); margin-bottom: var(--space-12); font-size: var(--font-size-sm);"><strong>Objetivo:</strong> ${algoritmo.objetivo}</p>` : ''}
        ${algoritmo.poblacion ? `<p style="color: var(--color-text-secondary); margin-bottom: var(--space-16); font-size: var(--font-size-sm);"><strong>Población diana:</strong> ${algoritmo.poblacion}</p>` : ''}
        <div class="algorithm-steps">
          ${algoritmo.pasos.map(paso => `
            <div class="algorithm-step">
              <div class="step-number">${paso.paso}</div>
              <div class="step-content">
                <div class="step-title">${paso.titulo}</div>
                ${paso.descripcion ? `<div class="step-description">${paso.descripcion}</div>` : ''}
                ${paso.farmacos && paso.farmacos.length > 0 ? `
                  <div class="step-farmacos">
                    ${paso.farmacos.map(f => `<span class="farmaco-tag">💊 ${f}</span>`).join('')}
                  </div>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
}

// Render Favoritos
function renderFavoritos() {
  const grid = document.getElementById('favoritosGrid');
  const emptyState = document.getElementById('emptyFavorites');
  
  const favSintomas = favorites.sintomas.map(index => {
    const sintoma = data.sintomas_json[index];
    const icon = getCategoryIcon(sintoma.categoria);
    const color = getCategoryColor(sintoma.categoria);
    return {
      type: 'sintoma',
      index: index,
      html: `
        <div class="card" style="border-left: 4px solid ${color};" onclick="viewSintomaDetail(${index})">
          <h3 class="card-title">${icon} ${sintoma.nombre}</h3>
          <p class="card-meta">${sintoma.descripcion}</p>
          <button class="btn btn-small" style="margin-top: 12px;" onclick="removeFavorite('sintomas', ${index}); event.stopPropagation();">
            Quitar de favoritos
          </button>
        </div>
      `
    };
  });
  
  const favFarmacos = favorites.farmacos.map(index => {
    const farmaco = data.farmacos_json[index];
    return {
      type: 'farmaco',
      index: index,
      html: `
        <div class="card card-border-left" onclick="showFarmacoDetail(${index})">
          <h3 class="card-title">💊 ${farmaco.nombre}</h3>
          <p class="card-meta">${farmaco.categoria}</p>
          <div style="margin-top: 12px;">
            ${farmaco.usos.slice(0, 2).map(uso => `<span class="badge badge-success">${uso}</span>`).join('')}
          </div>
          <button class="btn btn-small" style="margin-top: 12px;" onclick="removeFavorite('farmacos', ${index}); event.stopPropagation();">
            Quitar de favoritos
          </button>
        </div>
      `
    };
  });
  
  const allFavorites = [...favSintomas, ...favFarmacos];
  
  if (allFavorites.length === 0) {
    grid.style.display = 'none';
    emptyState.style.display = 'block';
  } else {
    grid.style.display = 'grid';
    emptyState.style.display = 'none';
    grid.innerHTML = allFavorites.map(fav => fav.html).join('');
  }
}

function viewSintomaDetail(index) {
  switchView('sintomas');
  setTimeout(() => {
    const card = document.querySelector(`[data-type="sintoma"][data-index="${index}"]`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.click();
    }
  }, 100);
}

function removeFavorite(type, index) {
  const favIndex = favorites[type].indexOf(index);
  if (favIndex > -1) {
    favorites[type].splice(favIndex, 1);
  }
  renderFavoritos();
  
  // Update button in main view
  const card = document.querySelector(`[data-type="${type === 'sintomas' ? 'sintoma' : 'farmaco'}"][data-index="${index}"]`);
  if (card) {
    const btn = card.querySelector('.favorite-btn');
    if (btn) {
      btn.classList.remove('active');
      btn.textContent = '☆';
    }
  }
}

// Render Enfermedades (deprecated but keeping for compatibility)
function renderEnfermedades() {
  const grid = document.getElementById('enfermedadesGrid');
  const enfermedades = Object.entries(data.enfermedades_detalle);
  
  grid.innerHTML = enfermedades.map(([key, enfermedad]) => {
    const protocolosRelacionados = data.protocolos.filter(p => 
      p.enfermedades && p.enfermedades.some(e => e.includes(key.split('_')[0]))
    );
    
    return `
      <div class="card" data-type="enfermedad" data-key="${key}" onclick="toggleCard(this)">
        <h3 class="card-title">${enfermedad.nombre}</h3>
        <p class="card-meta">${enfermedad.sintomas_frecuentes.length} síntomas asociados</p>
        <div class="card-expanded">
          <p><strong>Síntomas más frecuentes:</strong></p>
          <div>
            ${enfermedad.sintomas_frecuentes.map(s => `<span class="badge badge-secondary">${s}</span>`).join('')}
          </div>
          ${protocolosRelacionados.length > 0 ? `
            <p style="margin-top: 16px;"><strong>Protocolos aplicables:</strong></p>
            <ul>
              ${protocolosRelacionados.map(p => `
                <li><a href="${p.url}" target="_blank" class="protocol-link">${p.nombre} ↗</a></li>
              `).join('')}
            </ul>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// Render Medicación (deprecated)
function renderMedicacion() {
  const grid = document.getElementById('medicacionGrid');
  
  grid.innerHTML = data.medicamentos.map(med => {
    return `
      <div class="card" data-type="medicacion" data-name="${med.nombre}">
        <h3 class="card-title">${med.nombre}</h3>
        <div>
          ${med.indicaciones.slice(0, 3).map(ind => {
            const label = ind.replace(/_/g, ' ');
            return `<span class="badge badge-success">${label}</span>`;
          }).join('')}
        </div>
        <button class="btn btn-small" style="margin-top: 16px;" onclick="showMedicationDetails('${med.nombre}')">
          Ver dosis
        </button>
      </div>
    `;
  }).join('');
}

// Render Protocolos (deprecated)
function renderProtocolos() {
  const grid = document.getElementById('protocolosGrid');
  
  const icons = ['📋', '🧠', '💉', '🫁', '🦴', '🍼', '⚖️', '🏠', '👶', '🔬', '💊', '🩺', '📖', '🔧', '❤️', '🌟', '✨', '🎯'];
  
  grid.innerHTML = data.protocolos.map((protocolo, index) => {
    return `
      <div class="card" data-type="protocolo" data-name="${protocolo.nombre}">
        <div style="font-size: 32px; margin-bottom: 12px;">${icons[index % icons.length]}</div>
        <h3 class="card-title" style="font-size: 16px;">${protocolo.nombre}</h3>
        <p class="card-meta">${protocolo.descripcion}</p>
        ${protocolo.sintomas ? `
          <div style="margin-top: 12px;">
            ${protocolo.sintomas.slice(0, 3).map(s => `<span class="badge badge-primary">${s}</span>`).join('')}
          </div>
        ` : ''}
        <a href="${protocolo.url}" target="_blank" class="btn btn-small" style="margin-top: 16px; width: 100%;">
          Acceder en pedpal.es ↗
        </a>
      </div>
    `;
  }).join('');
}

// Toggle card expansion
function toggleCard(cardElement) {
  cardElement.classList.toggle('expanded');
}

// Show medication details (deprecated)
function showMedicationDetails(medicationName) {
  // Deprecated - use showFarmacoDetail instead
}

// Close modal
function closeModal() {
  document.getElementById('detailModal').classList.remove('active');
}

// Perform search
function performSearch(query) {
  if (!query || query.length < 2) {
    // Reset all cards to visible
    document.querySelectorAll('.card').forEach(card => {
      card.style.display = '';
    });
    return;
  }

  const lowerQuery = query.toLowerCase();
  
  // Search in current view
  if (currentView === 'sintomas') {
    const grid = document.getElementById('sintomasGrid');
    const cards = grid.querySelectorAll('.card');
    cards.forEach(card => {
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes(lowerQuery) ? '' : 'none';
    });
  } else if (currentView === 'farmacos') {
    const grid = document.getElementById('farmacosGrid');
    const cards = grid.querySelectorAll('.card');
    cards.forEach(card => {
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes(lowerQuery) ? '' : 'none';
    });
  } else if (currentView === 'algoritmos') {
    const containers = document.querySelectorAll('.algorithm-container');
    containers.forEach(container => {
      const text = container.textContent.toLowerCase();
      container.style.display = text.includes(lowerQuery) ? '' : 'none';
    });
  } else if (currentView === 'favoritos') {
    const grid = document.getElementById('favoritosGrid');
    const cards = grid.querySelectorAll('.card');
    cards.forEach(card => {
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes(lowerQuery) ? '' : 'none';
    });
  }
}

// Generate flashcards from data
function generateFlashcards() {
  allFlashcards = [];
  
  // Generate from sintomas
  data.sintomas_json.forEach((sintoma, idx) => {
    let respuesta = `<strong>Definición:</strong> ${sintoma.descripcion}<br><br>`;
    respuesta += `<strong>Manejo Farmacológico:</strong><br>`;
    sintoma.manejo_farmacologico.forEach(f => {
      respuesta += `• <strong>${f.farmaco}:</strong> ${f.dosis} (${f.via})<br>`;
    });
    
    allFlashcards.push({
      tipo: 'sintoma',
      pregunta: `¿Cómo se maneja el síntoma: ${sintoma.nombre}?`,
      respuesta: respuesta
    });
  });
  
  // Generate from farmacos
  data.farmacos_json.forEach((farmaco, idx) => {
    let respuesta = `<strong>Categoría:</strong> ${farmaco.categoria}<br><br>`;
    respuesta += `<strong>Usos principales:</strong><br>`;
    farmaco.usos.forEach(uso => {
      respuesta += `• ${uso}<br>`;
    });
    respuesta += `<br><strong>Vías:</strong> ${farmaco.vias.join(', ')}<br><br>`;
    respuesta += `<strong>Dosis:</strong><br>`;
    Object.entries(farmaco.dosis).forEach(([key, value]) => {
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      respuesta += `• ${label}: ${value}<br>`;
    });
    
    allFlashcards.push({
      tipo: 'farmaco',
      pregunta: `¿Cuáles son los usos y dosis de: ${farmaco.nombre}?`,
      respuesta: respuesta
    });
  });
  
  // Generate from algoritmos
  const algoritmos = data.algoritmos_custom && data.algoritmos_custom.length > 0 
    ? data.algoritmos_custom 
    : data.algoritmos_predefinidos;
  
  algoritmos.forEach(algoritmo => {
    let respuesta = `<strong>Pasos del algoritmo:</strong><br><br>`;
    algoritmo.pasos.forEach(paso => {
      respuesta += `<strong>${paso.paso}. ${paso.titulo}:</strong><br>`;
      respuesta += `${paso.descripcion}<br>`;
      if (paso.farmacos && paso.farmacos.length > 0) {
        respuesta += `Fármacos: ${paso.farmacos.join(', ')}<br>`;
      }
      respuesta += `<br>`;
    });
    
    allFlashcards.push({
      tipo: 'algoritmo',
      pregunta: `¿Cuál es el algoritmo de: ${algoritmo.nombre}?`,
      respuesta: respuesta
    });
  });
  
  // Add custom mixed flashcards
  allFlashcards.push(
    {
      tipo: 'enfermedad',
      pregunta: 'PARÁLISIS CEREBRAL INFANTIL: ¿Síntomas y manejo principal?',
      respuesta: `<strong>Síntomas más frecuentes:</strong><br>
        • Espasticidad (70% pacientes CPP)<br>
        • Dolor neuropático y nociceptivo<br>
        • Irritabilidad<br>
        • Problemas nutricionales<br><br>
        <strong>Manejo:</strong><br>
        • Espasticidad: Baclofeno, fisioterapia, toxina botulínica<br>
        • Dolor neuropático: Gabapentina<br>
        • Nutrición: Dispositivos soporte nutricional`
    },
    {
      tipo: 'enfermedad',
      pregunta: 'CÁNCER INFANTIL: ¿Síntomas paliativos principales?',
      respuesta: `<strong>Síntomas más frecuentes final vida:</strong><br>
        1. Astenia (más frecuente)<br>
        2. Anorexia-caquexia (71-100%)<br>
        3. Dolor (85%)<br>
        4. Náuseas/vómitos<br>
        5. Disnea<br><br>
        <strong>Manejo:</strong><br>
        • Dolor: Morfina (escalera analgésica)<br>
        • Náuseas: Ondansetrón, Haloperidol`
    }
  );
  
  filteredFlashcards = [...allFlashcards];
}

// Filter flashcards
function filterFlashcards() {
  if (currentFlashcardFilter === 'all') {
    filteredFlashcards = [...allFlashcards];
  } else {
    filteredFlashcards = allFlashcards.filter(card => card.tipo === currentFlashcardFilter);
  }
  currentFlashcardIndex = 0;
  renderTarjetas();
}

// Shuffle flashcards
function shuffleFlashcards() {
  for (let i = filteredFlashcards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [filteredFlashcards[i], filteredFlashcards[j]] = [filteredFlashcards[j], filteredFlashcards[i]];
  }
  currentFlashcardIndex = 0;
  renderTarjetas();
}

// Render tarjetas
function renderTarjetas() {
  if (filteredFlashcards.length === 0) {
    document.getElementById('flashcardQuestion').textContent = 'No hay tarjetas disponibles';
    document.getElementById('flashcardAnswer').innerHTML = '';
    document.getElementById('flashcardCounter').textContent = '0 / 0';
    return;
  }
  
  const card = filteredFlashcards[currentFlashcardIndex];
  document.getElementById('flashcardQuestion').textContent = card.pregunta;
  document.getElementById('flashcardAnswer').innerHTML = card.respuesta;
  document.getElementById('flashcardCounter').textContent = `${currentFlashcardIndex + 1} / ${filteredFlashcards.length}`;
  
  // Reset flip
  document.getElementById('flashcard').classList.remove('flipped');
}

// Flip flashcard
function flipFlashcard() {
  document.getElementById('flashcard').classList.toggle('flipped');
}

// Next flashcard
function nextFlashcard() {
  if (filteredFlashcards.length === 0) return;
  currentFlashcardIndex = (currentFlashcardIndex + 1) % filteredFlashcards.length;
  renderTarjetas();
}

// Previous flashcard
function previousFlashcard() {
  if (filteredFlashcards.length === 0) return;
  currentFlashcardIndex = (currentFlashcardIndex - 1 + filteredFlashcards.length) % filteredFlashcards.length;
  renderTarjetas();
}

// Function to load custom algorithms from JSON
function loadCustomAlgoritmos(algoritmosJSON) {
  try {
    if (typeof algoritmosJSON === 'string') {
      data.algoritmos_custom = JSON.parse(algoritmosJSON);
    } else if (Array.isArray(algoritmosJSON)) {
      data.algoritmos_custom = algoritmosJSON;
    } else {
      console.error('Invalid algoritmos format. Expected array or JSON string.');
      return false;
    }
    renderAlgoritmos();
    console.log(`✅ ${data.algoritmos_custom.length} algoritmos cargados correctamente`);
    return true;
  } catch (error) {
    console.error('Error loading custom algoritmos:', error);
    return false;
  }
}

// Expose functions globally for external use
window.loadCustomAlgoritmos = loadCustomAlgoritmos;
window.flipFlashcard = flipFlashcard;
window.nextFlashcard = nextFlashcard;
window.previousFlashcard = previousFlashcard;
window.shuffleFlashcards = shuffleFlashcards;
window.viewRelatedAlgorithm = viewRelatedAlgorithm;
window.closeMobileMenu = closeMobileMenu;
window.switchView = switchView;

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}