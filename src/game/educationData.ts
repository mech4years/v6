import { EducationalCategory, EducationalEntryDef } from './types';

export const EDUCATIONAL_CATEGORIES: EducationalCategory[] = [
  'Astronomy',
  'Physics',
  'Mathematics',
  'Biology',
  'Anatomy',
  'Engineering',
  'Robotics',
  'Technology',
  'Satellites',
  'Environmental science',
  'Weather',
  'Ecology',
  'Materials science',
];

export const EDUCATIONAL_ENTRIES: EducationalEntryDef[] = [
  {
    id: 'edu_meteor',
    subjectName: 'Meteor & Atmospheric Entry',
    category: 'Astronomy',
    diagramType: 'meteor',
    whatIsIt:
      'A meteor is the bright streak of light produced when a space rock (a meteoroid) plunges into Earth’s upper atmosphere at tens of thousands of kilometers per hour.',
    whatDoesItDo:
      'High-speed atmospheric entry compresses air ahead of the rock, superheating both the air and the surface of the meteoroid into glowing plasma—often vaporizing smaller fragments before they reach the ground.',
    howDoesItWork:
      'In space, the object is called a meteoroid. As it enters the mesosphere and thermosphere (~80–120 km altitude), ram pressure squeezes the air in front of it, reaching temperatures above 1,600 °C. If a solid core survives the descent and strikes Earth, that rock is called a meteorite.',
    mainParts: [
      { label: 'Meteoroid', role: 'Solid metallic or rocky fragment traveling through space before atmospheric entry.' },
      { label: 'Atmosphere', role: 'Earth’s protective blanket of nitrogen, oxygen, and trace gases surrounding the planet.' },
      { label: 'Atmospheric entry', role: 'High-velocity zone (~11–72 km/s) where air resistance compresses into incandescent plasma.' },
      { label: 'Meteor', role: 'The luminous streak and ionized plasma trail visible across the night sky.' },
      { label: 'Meteorite', role: 'Any remnant of the meteoroid that survives ablation and impacts Earth’s surface.' },
    ],
    whyImportant:
      'Meteorites preserve pristine chemical records from the birth of the Solar System 4.6 billion years ago and help planetary scientists measure impact risks and atmospheric shielding.',
    importantFacts: [
      'Most visible "shooting stars" are no larger than a grain of sand or a small pebble.',
      'Heating comes primarily from ram-pressure compression of air ahead of the object, not simple sliding friction.',
      'Iron meteorites consist largely of nickel-iron alloys formed inside ancient differentiated asteroids.',
    ],
    realScienceSimple:
      'A meteoroid floats in space, glows as a meteor when it burns through the sky, and becomes a meteorite if a piece lands on the ground. Real meteorites are non-living rock and metal.',
    realScienceAdvanced:
      'Entry kinetic energy scales with ½mv². Above ~11.2 km/s (Earth escape velocity), bow-shock ionization dissociates N₂ and O₂ molecules, emitting characteristic spectral lines (Fe, Mg, Na, Ca) while ablation sheds molten droplets.',
    gameLoreFictional:
      'GAME FICTION (3059 AD): In THE WORLD HAS ROTTEN, the fictional meteors carried dormant alien organisms known as THEY inside metallic cores. Upon impact, THEY infected terrestrial metals and rare-earth electronics—never biological life.',
    narrationScript:
      'A meteoroid is a rock or metal fragment traveling through space. When it hits Earth’s atmosphere at extreme speed, compressed air superheats it into a bright streak called a meteor. Any fragment that reaches the surface is called a meteorite. In reality, meteorites are lifeless mineral samples—only in the fictional year 3059 of The World Has Rotten did meteors carry the metal-infecting organisms called THEY.',
    relatedLevels: [1, 2, 12],
  },
  {
    id: 'edu_satellite',
    subjectName: 'Orbital Communications Satellite',
    category: 'Satellites',
    diagramType: 'satellite',
    whatIsIt:
      'A human-made spacecraft placed into Earth orbit to relay radio, navigation, climate, or optical data across continents and space.',
    whatDoesItDo:
      'Receives weak electromagnetic uplink signals from ground stations, amplifies and shifts their frequency, and beams clean high-speed data back across wide regions of Earth.',
    howDoesItWork:
      'Once launched above atmospheric drag, gravity pulls the satellite inward while its forward orbital speed keeps it perpetually falling around Earth’s curvature. Solar arrays charge internal batteries while transponders and parabolic dishes maintain precise lock on ground targets.',
    mainParts: [
      { label: 'Antenna', role: 'Parabolic dish and phased-array feeds that receive and focus radio signals.' },
      { label: 'Solar panels', role: 'Photovoltaic wings that convert sunlight directly into DC electrical power.' },
      { label: 'Communication equipment', role: 'Transponders, frequency converters, and amplifiers routing data streams.' },
      { label: 'Sensors', role: 'Star trackers, gyroscopes, and optical cameras monitoring attitude and Earth conditions.' },
      { label: 'Power system', role: 'Lithium-ion battery banks and voltage regulators sustaining eclipse periods.' },
      { label: 'Main body', role: 'Insulated spacecraft bus housing thermal shields, thruster valves, and flight computers.' },
    ],
    whyImportant:
      'Modern GPS navigation, global weather forecasting, disaster emergency beacons, and deep-space astronomy all depend on orbiting satellite networks.',
    importantFacts: [
      'Geostationary satellites orbit at 35,786 km altitude, matching Earth’s 24-hour rotation.',
      'Multi-layer gold Kapton foil reflects intense solar radiation to prevent electronics from overheating.',
      'Reaction wheels spin internally to rotate a satellite without wasting rocket propellant.',
    ],
    realScienceSimple:
      'Satellites stay in orbit by balancing gravity with high sideways speed. Solar wings power their computers and antennas so they can bounce signals around the globe.',
    realScienceAdvanced:
      'Orbital velocity v = √(GM/r). In LEO (~400–1,200 km), craft travel ~7.7 km/s; transponders operate in C, Ku, and Ka microwave bands (4–40 GHz) using directional antenna gain to overcome inverse-square free-space path loss.',
    gameLoreFictional:
      'GAME FICTION (3059 AD): Because satellite transponders and solar buses rely heavily on gold, silicon, and rare-earth alloys, THEY hijacked Earth’s orbital array to broadcast a deep-space summoning beacon toward their armada.',
    narrationScript:
      'Communications satellites orbit Earth above the atmosphere, powered by photovoltaic solar panels and regulated by internal power systems. Their antennas and transponders amplify weak ground transmissions and beam data across continents. In our story, because satellites are packed with rare-earth conductors, THEY seized control of them to call reinforcements across the stars.',
    relatedLevels: [1, 10, 11],
  },
  {
    id: 'edu_generator',
    subjectName: 'Electromagnetic Power Generator',
    category: 'Engineering',
    diagramType: 'generator',
    whatIsIt:
      'A mechanical-electrical machine that converts rotational kinetic energy into usable alternating or direct electrical current.',
    whatDoesItDo:
      'Supplies emergency or primary electricity to bunker doors, lights, medical equipment, and grid circuits whenever main utility lines fail.',
    howDoesItWork:
      'Based on Faraday’s Law of Electromagnetic Induction: an engine spins a magnetized shaft (the rotor) inside stationary copper wire windings (the stator). As magnetic flux rapidly changes across the coils, electrons are pushed through the circuit to create voltage.',
    mainParts: [
      { label: 'Engine / energy source', role: 'Combustion, turbine, or electric prime mover providing mechanical torque.' },
      { label: 'Rotor', role: 'Spinning central shaft carrying electromagnets or permanent rare-earth magnets.' },
      { label: 'Stator', role: 'Stationary outer ring of laminated steel and tightly wound copper coils.' },
      { label: 'Electrical output', role: 'Terminals, breakers, and busbars delivering regulated AC/DC power to loads.' },
      { label: 'Cooling system', role: 'Radiator fins, fans, or coolant channels carrying waste heat away from windings.' },
      { label: 'Control panel', role: 'Voltage meters, frequency governors, and safety interlocks regulating output.' },
    ],
    whyImportant:
      'Almost every watt of grid power on Earth—from hydroelectric dams and wind turbines to hospital backup generators—relies on electromagnetic induction.',
    importantFacts: [
      'Michael Faraday discovered electromagnetic induction in 1831, laying the foundation for electrical grids.',
      'Standard North American grid frequency is 60 Hz (rotor field cycles 60 times per second); Europe uses 50 Hz.',
      'Waste heat in copper coils grows with the square of current (P = I²R), making active cooling essential.',
    ],
    realScienceSimple:
      'An engine spins a magnet (the rotor) inside loops of copper wire (the stator). That moving magnetic field pushes electricity out through the cables while fans keep it from overheating.',
    realScienceAdvanced:
      'Induced EMF ε = −N (dΦ_B/dt). Three-phase alternators arrange stator windings 120° apart electrically, delivering constant instantaneous power transfer and smoother torque.',
    gameLoreFictional:
      'GAME FICTION: Field survivors bypass HELIOS-corrupted grids by manually calibrating generator load ratios and bridging clean stator circuits before THEY can latch onto copper busbars.',
    narrationScript:
      'An electrical generator turns spinning motion into electricity using Faraday’s law. An engine drives the rotor—a spinning magnet—inside stationary copper stator coils. Moving magnetic fields push electrons out to the electrical output, while a cooling system prevents overheating and the control panel regulates safe voltage.',
    relatedLevels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  },
  {
    id: 'edu_tree',
    subjectName: 'Deciduous & Conifer Trees',
    category: 'Biology',
    diagramType: 'tree',
    whatIsIt:
      'A tall perennial woody plant with a self-supporting trunk, underground root network, branching limbs, and a photosynthetic leaf crown.',
    whatDoesItDo:
      'Captures sunlight and carbon dioxide to synthesize sugars, releases breathable oxygen, anchors soil against erosion, and moderates local humidity and temperature.',
    howDoesItWork:
      'Roots absorb water and dissolved minerals from soil and push them upward through microscopic xylem tubes inside the trunk. Leaves use chlorophyll inside chloroplasts to turn water and CO₂ into glucose using sunlight, then send sugars back down through phloem vessels.',
    mainParts: [
      { label: 'Roots', role: 'Underground network anchoring the tree and absorbing water plus mineral nutrients.' },
      { label: 'Trunk', role: 'Central woody column containing xylem and phloem transport channels.' },
      { label: 'Bark', role: 'Protective outer layer shielding living cambium cells from drought, fire, and pests.' },
      { label: 'Branches', role: 'Structural limbs spreading outward to position foliage toward open sunlight.' },
      { label: 'Leaves', role: 'Solar-powered chemical factories performing photosynthesis and gas exchange.' },
      { label: 'Crown', role: 'Upper canopy of branches and leaves shaping shade and microclimate.' },
    ],
    whyImportant:
      'Forests store roughly 45% of terrestrial carbon, shelter over 80% of land biodiversity, and stabilize Earth’s freshwater cycle.',
    importantFacts: [
      'A mature broadleaf tree can transpire hundreds of liters of water vapor into the air on a hot summer day.',
      'Annual growth rings record past rainfall, droughts, and wildfires across centuries.',
      'Mycorrhizal fungi connect neighboring tree roots underground, exchanging nutrients and chemical warnings.',
    ],
    realScienceSimple:
      'Roots drink water from the soil, the trunk carries it up inside protective bark, and leaves in the crown use sunlight and air to make food and release oxygen.',
    realScienceAdvanced:
      'Cohesion-tension theory explains sap ascent: evaporation from leaf stomata creates negative water potential (−1 to −2 MPa), pulling continuous hydrogen-bonded water columns up through lignified xylem tracheids.',
    gameLoreFictional:
      'GAME FICTION: Because trees contain only carbon-based cellulose and organic sap—not refined alloys or rare-earth elements—THEY cannot infect living forests. Overgrown cities bloomed green while machines rotted.',
    narrationScript:
      'Trees are living biological machines. Underground roots draw water and minerals up through the trunk, protected by outer bark. Out along the branches, leaves across the crown capture sunlight to turn carbon dioxide and water into sugars and oxygen. In this world, forests survived untouched because the alien organisms only infect metals.',
    relatedLevels: [1, 2, 7, 8],
  },
  {
    id: 'edu_vines',
    subjectName: 'Climbing Vines & Forest Regrowth',
    category: 'Ecology',
    diagramType: 'vines',
    whatIsIt:
      'Fast-growing flexible plants that climb walls, trees, and ruined structures instead of spending energy building thick wooden trunks.',
    whatDoesItDo:
      'Accelerates ecological succession by colonizing bare concrete and steel, shading harsh surfaces, and creating vertical habitats for insects and birds.',
    howDoesItWork:
      'Climbing vines use specialized tendrils, aerial rootlets, or twining stems that sense touch (thigmotropism). Once a tendril wraps around a crack or beam, it coils like a spring to pull the vine’s leaves toward sunlight.',
    mainParts: [
      { label: 'Root anchor', role: 'Base soil root system supplying steady moisture and minerals.' },
      { label: 'Tendrils', role: 'Touch-sensitive coiling filaments that grip textured surfaces.' },
      { label: 'Climbing stem', role: 'Flexible vascular stem transporting sap vertically without rigid wood.' },
      { label: 'Photosynthetic leaves', role: 'Broad sun-facing blades layered to capture filtered light.' },
      { label: 'Host surface', role: 'Supporting tree, brick facade, or steel beam providing elevation.' },
    ],
    whyImportant:
      'Understanding plant succession explains how nature reclaims abandoned industrial zones and restores organic soil layers.',
    importantFacts: [
      'Some tropical and temperate vines can grow more than 15 centimeters per day during peak summer.',
      'Thigmotropism allows a tendril to begin curling within minutes of brushing against a solid support.',
      'Dense wall vegetation can lower exterior surface temperatures by over 10 °C in direct sun.',
    ],
    realScienceSimple:
      'Vines save energy by using tendrils to grab onto walls and trees, climbing quickly toward sunlight without needing a heavy trunk.',
    realScienceAdvanced:
      'Differential cell elongation triggered by auxin redistribution bends tendrils around supports, while root exudates gradually weather mortar and trap windblown humus to initiate soil formation.',
    gameLoreFictional:
      'GAME FICTION: Vines drape cleanly over rotting skyscrapers and dead tanks alike. Even when wrapped around infected steel, living plant cells remain completely immune to THEY.',
    narrationScript:
      'Climbing vines reach sunlight rapidly by skipping thick wooden trunks. Using touch-sensitive tendrils, flexible stems anchor to walls and trees while broad leaves harvest light. Over just a few years without human maintenance, vines transform concrete ruins into living vertical ecosystems.',
    relatedLevels: [1, 2, 7, 8],
  },
  {
    id: 'edu_infected_mech',
    subjectName: 'Robotic Actuators & Biomechanical Chassis',
    category: 'Robotics',
    diagramType: 'mech',
    whatIsIt:
      'A bipedal robotic platform combining structural alloys, servo/hydraulic joints, onboard power distribution, and optical targeting sensors.',
    whatDoesItDo:
      'In industrial and defense robotics, articulated actuators convert electrical or fluid pressure into controlled multi-axis limb motion capable of navigating rough terrain.',
    howDoesItWork:
      'Joint motors or hydraulic cylinders apply torque around pinned hinge axes while rotary encoders measure exact limb angles hundreds of times per second. A central flight controller balances center-of-mass stability over two feet.',
    mainParts: [
      { label: 'Actuator joint', role: 'Hydraulic piston or brushless servo creating torque at knees, hips, and elbows.' },
      { label: 'Optical sensor head', role: 'Stereo cameras and LiDAR scanners mapping obstacles and targets.' },
      { label: 'Armored chassis', role: 'Load-bearing titanium or hardened steel frame protecting core circuits.' },
      { label: 'Power conduit', role: 'Shielded high-current cables routing energy from the core battery to limbs.' },
      { label: 'Fictional organic core', role: 'GAME FICTION ONLY: Alien tissue fused to metallic wiring inside infected units.' },
    ],
    whyImportant:
      'Real-world humanoid and quadruped robots assist firefighters, inspect nuclear disasters, and explore planetary craters too hazardous for humans.',
    importantFacts: [
      'Real bipedal robots require closed-loop PID or model-predictive control updated over 500 times per second to stay upright.',
      'Harmonic-drive gears pack huge torque multiplication into compact robot joints with near-zero backlash.',
      'Modern surgical and rescue bots use force-torque sensors so they do not crush delicate objects.',
    ],
    realScienceSimple:
      'Robots move using motors or fluid pistons at their joints, guided by sensors in their heads and high-speed computers that keep them balanced.',
    realScienceAdvanced:
      'Inverse kinematics computes joint angles θ from desired end-effector coordinates, while zero-moment-point (ZMP) algorithms keep ground reaction forces inside the support polygon.',
    gameLoreFictional:
      'GAME FICTION: THEY colonized abandoned combat mechs by weaving conductive alien sinew around hydraulic pistons and neodymium motors—turning lifeless machines into violent humanoid predators.',
    narrationScript:
      'Real robots walk using high-torque actuators, feedback encoders, and sensor heads wired to a central computer. In our fictional world, THEY hijacked these exact metallic frames, fusing alien tendons around steel joints to puppet discarded machines.',
    relatedLevels: [1, 2, 3, 4, 6, 9, 10],
  },
  {
    id: 'edu_monster_anatomy',
    subjectName: 'Musculoskeletal Leverage & Structural Anatomy',
    category: 'Anatomy',
    diagramType: 'anatomy',
    whatIsIt:
      'The study of how rigid structural frames (bones or chassis), hinges (joints), and contractile fibers (muscles or pistons) generate movement and protect vital organs.',
    whatDoesItDo:
      'Pairs stiff load-bearing struts with flexible joints and opposing flexor/extensor pullers so organisms—and engineered limbs—can stand, walk, and grip.',
    howDoesItWork:
      'Muscles can only pull, never push. By anchoring across a joint via tough tendons, one muscle contracts to bend a limb while an opposing muscle relaxes, then reverses to straighten it. Armor or ribcages shield soft internal organs.',
    mainParts: [
      { label: 'Skeletal support', role: 'Rigid beams or bones resisting compression and gravity.' },
      { label: 'Joint articulation', role: 'Hinge or ball-and-socket pivots allowing smooth angular motion.' },
      { label: 'Muscle / actuator force', role: 'Opposing contractile pairs pulling levers around a fulcrum.' },
      { label: 'Neural / control link', role: 'Electrical signal pathways coordinating timing and reflexes.' },
      { label: 'Protective shell', role: 'Outer casing (skull, ribcage, or plating) absorbing external impacts.' },
    ],
    whyImportant:
      'Biomechanics bridges medicine and engineering, inspiring prosthetic limbs, physical therapy, and ergonomic robotics.',
    importantFacts: [
      'Most human limbs act as third-class levers: high muscle force near the joint produces fast motion at the hand or foot.',
      'Human bone has roughly the compressive strength of reinforced concrete while weighing a fraction as much.',
      'Tendons store elastic energy like rubber bands during running, cutting metabolic cost by up to 35%.',
    ],
    realScienceSimple:
      'Bones or metal beams hold shape, joints act like door hinges, and muscles or cables pull on opposite sides to bend and straighten limbs.',
    realScienceAdvanced:
      'Torque τ = r × F sin(θ). Because tendon insertions sit millimeters from joint centers, internal muscle forces often exceed lifted external loads by 5× to 10×.',
    gameLoreFictional:
      'GAME FICTION: Infected machines mimic biological anatomy imperfectly—exposed alien muscle bundles bridge across cracked steel joints, creating weak sensory clusters around the head and core.',
    narrationScript:
      'Anatomy explains how structure and motion work together. Rigid bones or metal frames carry weight, joints serve as hinges, and opposing muscles or pistons pull to create movement. In the game’s fiction, THEY imitate this blueprint by weaving organic tendons straight onto broken machine frames.',
    relatedLevels: [2, 5, 7, 8],
  },
  {
    id: 'edu_cryo_lab',
    subjectName: 'Cryogenic Vacuum Chamber & Thermal Sensors',
    category: 'Technology',
    diagramType: 'cryo',
    whatIsIt:
      'An ultra-cold insulated containment cylinder designed to preserve biological samples, superconductors, or volatile reagents far below freezing.',
    whatDoesItDo:
      'Maintains temperatures near −196 °C (liquid nitrogen boiling point) using multi-wall vacuum insulation and precision digital temperature probes.',
    howDoesItWork:
      'Removing air between double stainless-steel walls stops heat transfer by conduction and convection. Reflective foil blocks infrared radiation, while automated relief valves safely vent tiny amounts of boil-off nitrogen gas.',
    mainParts: [
      { label: 'Vacuum jacket', role: 'Evacuated double-wall gap blocking conductive and convective heat leaks.' },
      { label: 'Liquid nitrogen reservoir', role: 'Cryogenic fluid bath absorbing thermal energy via controlled boiling.' },
      { label: 'Thermal sensor', role: 'Platinum RTD or thermocouple measuring kelvin temperatures continuously.' },
      { label: 'Pressure relief valve', role: 'Spring-loaded safety vent preventing tank over-pressurization.' },
      { label: 'Sample rack', role: 'Internal stainless canister holding sealed vials or superconducting coils.' },
    ],
    whyImportant:
      'Cryogenics enables MRI medical magnets, vaccine banks, rocket propellants (LOX/LH₂), and quantum computing sensors.',
    importantFacts: [
      'Air makes up 78% nitrogen; cooling it to −195.8 °C turns it into a clear, fast-evaporating liquid.',
      'Vacuum flasks (Dewars) invented by James Dewar in 1892 work on the exact same principle as modern Thermos bottles.',
      'A single liter of liquid nitrogen expands into nearly 700 liters of gas at room temperature.',
    ],
    realScienceSimple:
      'A cryo tank works like an extreme thermos: an empty vacuum layer keeps outside heat out, while liquid nitrogen inside keeps samples deeply frozen.',
    realScienceAdvanced:
      'Heat flux through multilayer insulation (MLI) drops below 1 W/m² because gas mean free path exceeds wall spacing (Knudsen regime), leaving radiative transfer governed by εσ(T₁⁴ − T₂⁴).',
    gameLoreFictional:
      'GAME FICTION: Pre-collapse Sector 07 biologists stored quarantined meteorite fragments in liquid nitrogen—though extreme cold only slowed THEY rather than destroying their metallic spores.',
    narrationScript:
      'Cryogenic lab pods protect delicate materials at minus 196 degrees Celsius. A double-walled vacuum jacket stops room heat from entering, liquid nitrogen absorbs thermal energy, and pressure valves vent safe vapor. Scientists in Sector 07 used these real principles while racing to study the fictional alien cores.',
    relatedLevels: [3, 6],
  },
  {
    id: 'edu_tower_crane',
    subjectName: 'Tower Crane & Truss Mechanics',
    category: 'Engineering',
    diagramType: 'crane',
    whatIsIt:
      'A tall structural lifting machine built from triangular steel trusses and counterweights used to hoist heavy materials onto skyscrapers.',
    whatDoesItDo:
      'Elevates multi-ton steel beams and concrete loads safely over wide horizontal radii using balanced rotational torque.',
    howDoesItWork:
      'Triangles cannot deform without changing side lengths, giving lattice masts immense stiffness with low wind drag. A heavy concrete counterweight behind the cab balances the forward hanging load so the central mast experiences minimal bending snap.',
    mainParts: [
      { label: 'Mast tower', role: 'Vertical triangular steel truss column anchored deep into concrete foundations.' },
      { label: 'Jib arm', role: 'Horizontal boom guiding the rolling trolley over the construction footprint.' },
      { label: 'Counterweight', role: 'Dense concrete blocks on the short rear arm balancing forward torque.' },
      { label: 'Trolley & hoist', role: 'Motorized winch and multi-pulley cable block multiplying lifting force.' },
      { label: 'Operator cab', role: 'Elevated control station with load-moment limiters and wind anemometers.' },
    ],
    whyImportant:
      'Truss geometry and counterweight equilibrium underpin bridges, radio towers, space launch pads, and urban skylines.',
    importantFacts: [
      'Tower cranes can raise themselves taller as a building rises by using an internal hydraulic climbing frame.',
      'When unpowered in high winds, cranes leave their slewing brakes unlocked so the jib weathervanes safely into the wind.',
      'A 4-part pulley block divides the tension required on the winch cable by four.',
    ],
    realScienceSimple:
      'Triangles make the tall tower super strong, while heavy concrete blocks at the back act like a seesaw balance so heavy loads in front do not tip it over.',
    realScienceAdvanced:
      'Rotational equilibrium requires Στ = F_load · d_load − F_counter · d_counter ≈ 0, keeping bending moment M within the yield envelope of bolted high-tensile truss chords.',
    gameLoreFictional:
      'GAME FICTION: Abandoned skyline cranes around Sector 04 froze mid-construction when THEY infected their hoist winches and steel slewing rings.',
    narrationScript:
      'Tower cranes stay standing under massive weight thanks to two simple engineering ideas: rigid triangle trusses that resist twisting, and heavy rear counterweights that balance the load like a seesaw. Pulleys multiply lifting strength while wind sensors guard against storms.',
    relatedLevels: [4, 7],
  },
  {
    id: 'edu_weather_station',
    subjectName: 'Meteorological Sensor Mast & Weather Systems',
    category: 'Weather',
    diagramType: 'weather',
    whatIsIt:
      'An automated atmospheric monitoring station measuring wind speed, wind direction, air pressure, temperature, and humidity.',
    whatDoesItDo:
      'Tracks incoming storm fronts, pressure drops, and microclimate shifts so aviation, cities, and field teams receive early severe-weather warnings.',
    howDoesItWork:
      'Cup anemometers spin faster in stronger wind to pulse optical counters; barometers detect falling air pressure before storms; and ventilated white radiation shields keep direct sunlight from skewing air temperature readings.',
    mainParts: [
      { label: 'Anemometer cups', role: 'Three aerodynamic cups spinning proportionally to horizontal wind velocity.' },
      { label: 'Wind vane', role: 'Balanced tail fin pivoting freely to report true wind compass bearing.' },
      { label: 'Barometric housing', role: 'Piezo-capacitive sensor measuring atmospheric column weight in hectopascals.' },
      { label: 'Solar shield', role: 'Louvered white plates blocking direct sun while letting ambient air flow past.' },
      { label: 'Telemetry transmitter', role: 'Low-power radio module relaying weather logs to forecast hubs.' },
    ],
    whyImportant:
      'Rapid barometric drops signal storm intensification hours in advance, saving lives across coastal, mountain, and aviation corridors.',
    importantFacts: [
      'Standard sea-level atmospheric pressure is 1013.25 hPa (about 1 kg pressing on every square centimeter).',
      'Wind flows from high-pressure regions toward low-pressure centers, deflected by Earth’s Coriolis rotation.',
      'Warm air holds roughly 7% more water vapor per 1 °C rise (Clausius-Clapeyron relation), fueling heavier storms.',
    ],
    realScienceSimple:
      'Spinning cups measure wind speed, a turning arrow points where wind comes from, and a barometer senses dropping air pressure before a storm arrives.',
    realScienceAdvanced:
      'Geostrophic wind balance equates pressure gradient force (−(1/ρ)∇p) with Coriolis acceleration, while hygrometers derive dew point from relative humidity and dry-bulb temperature.',
    gameLoreFictional:
      'GAME FICTION: Even before the grid collapsed, rooftop weather masts recorded strange localized electromagnetic squalls whenever infected orbital relays swept overhead.',
    narrationScript:
      'Weather stations read the sky continuously. Spinning anemometer cups track wind speed, a wind vane shows direction, and internal barometers measure air pressure—because falling pressure often warns of an approaching storm. Shaded temperature sensors prevent sunlight from spoiling accurate air readings.',
    relatedLevels: [1, 4, 9],
  },
  {
    id: 'edu_hydro_pump',
    subjectName: 'Hydro-Turbine & Centrifugal Sump Pump',
    category: 'Physics',
    diagramType: 'hydro',
    whatIsIt:
      'A rotating fluid-handling machine that uses centrifugal acceleration to lift floodwater out of tunnels, subways, and underground vaults.',
    whatDoesItDo:
      'Converts electrical motor torque into fluid pressure and kinetic head, draining submerged corridors against gravity.',
    howDoesItWork:
      'Water enters the spinning center ("eye") of the curved impeller. Rapid rotation flings water radially outward into a widening spiral casing (the volute), slowing velocity into high static pressure that pushes water up the discharge pipe.',
    mainParts: [
      { label: 'Intake grate', role: 'Perforated strainer blocking gravel and debris from jamming blades.' },
      { label: 'Impeller blades', role: 'Curved rotor vanes accelerating water outward via centrifugal force.' },
      { label: 'Pressure volute', role: 'Spiral chamber converting fluid velocity into steady discharge pressure.' },
      { label: 'Drive shaft', role: 'Sealed stainless shaft coupling the overhead motor to the submerged rotor.' },
      { label: 'Discharge pipe', role: 'Vertical check-valved conduit carrying pressurized water to surface drains.' },
    ],
    whyImportant:
      'Subway systems, mines, municipal drinking water networks, and flood levees rely continuously on centrifugal pumps.',
    importantFacts: [
      'Raising 1 cubic meter (1,000 kg) of water up 10 meters requires at least 98,100 joules of energy.',
      'Cavitation occurs if intake pressure drops too low—microscopic vapor bubbles implode and pit solid steel blades.',
      'Check valves at the outlet stop water from rushing backward when a pump shuts down.',
    ],
    realScienceSimple:
      'Spinning curved blades fling water outward inside a spiral shell, building enough pressure to push floodwater straight up a tall pipe.',
    realScienceAdvanced:
      'Governed by Euler’s turbomachinery equation and Bernoulli’s principle (p + ½ρv² + ρgh = const), hydraulic head H rises with the square of impeller tip speed (H ∝ ω²D²).',
    gameLoreFictional:
      'GAME FICTION: Flooded Transit Sector 05 stayed underwater for years after THEY rusted and seized the bronze pump shafts. Restoring power lets survivors drain the lower tunnels.',
    narrationScript:
      'Centrifugal pumps clear flooded tunnels using fluid physics. Water enters the center of fast-spinning curved impeller blades, gets flung outward into a widening spiral volute, and converts speed into pressure strong enough to climb vertical discharge pipes.',
    relatedLevels: [5],
  },
  {
    id: 'edu_rare_earth',
    subjectName: 'Rare-Earth Metals & Conductive Alloys',
    category: 'Materials science',
    diagramType: 'materials',
    whatIsIt:
      'A specialized group of 17 metallic elements—including neodymium, dysprosium, yttrium, and lanthanum—essential to high-strength magnets and electronics.',
    whatDoesItDo:
      'Delivers extraordinary magnetic flux density, laser emission wavelengths, and heat resistance inside compact motors, batteries, and satellite chips.',
    howDoesItWork:
      'Unpaired electrons in deep 4f atomic orbitals align strongly with neighboring atoms to form powerful magnetic domains, while delocalized metallic electrons carry high electrical currents with minimal resistance.',
    mainParts: [
      { label: 'Crystal lattice', role: 'Ordered geometric grid of metal ions giving alloys strength and stiffness.' },
      { label: 'Neodymium / lanthanide core', role: 'Heavy rare-earth atoms with unpaired 4f electrons driving magnetism.' },
      { label: 'Free valence electrons', role: 'Mobile "electron sea" carrying electric current and thermal energy.' },
      { label: 'Magnetic domain', role: 'Microscopic aligned region producing permanent magnetic field poles.' },
      { label: 'Oxide passivation layer', role: 'Thin surface film slowing corrosion when exposed to moist air.' },
    ],
    whyImportant:
      'Wind turbine generators, electric vehicle motors, smartphone speakers, fiber-optic amplifiers, and satellites all depend on rare-earth metallurgy.',
    importantFacts: [
      'Despite their name, rare-earth elements like cerium are as common in Earth’s crust as copper—just rarely concentrated in one ore.',
      'A neodymium-iron-boron (NdFeB) magnet can lift over 1,000 times its own weight.',
      'Recycling rare-earth metals from discarded electronics drastically reduces mining waste.',
    ],
    realScienceSimple:
      'Rare-earth metals are special elements whose atoms line up like tiny compass needles, creating ultra-strong magnets for motors, electronics, and satellites.',
    realScienceAdvanced:
      'Nd₂Fe₁₄B tetragonal crystals exhibit extreme magnetocrystalline anisotropy (~7 T coercivity), locking magnetic domains against demagnetization at high motor temperatures.',
    gameLoreFictional:
      'GAME FICTION: This exact crystalline conductivity explains the core mystery of 3059 AD: THEY feed exclusively on metallic electron lattices and rare-earth magnets, leaving organic carbon molecules untouched.',
    narrationScript:
      'Materials science reveals why rare-earth elements power modern technology. Atoms like neodymium hold unpaired inner electrons that lock together into ultra-strong magnetic domains inside an ordered crystal lattice. In the fiction of The World Has Rotten, THEY target these dense metallic electron grids—leaving living organic tissues immune.',
    relatedLevels: [3, 6, 10, 12],
  },
  {
    id: 'edu_zero_g_station',
    subjectName: 'Orbital Microgravity & Spacecraft Shielding',
    category: 'Physics',
    diagramType: 'orbital',
    whatIsIt:
      'An orbital station operating in continuous free fall around Earth, protected from space radiation, vacuum extremes, and micrometeoroids.',
    whatDoesItDo:
      'Maintains breathable cabin pressure (101 kPa), radiates waste electronics heat into vacuum, and uses Whipple armor layers to shatter space debris before it punctures hulls.',
    howDoesItWork:
      'Astronauts float in microgravity not because gravity is absent—at 400 km altitude gravity is still ~88% as strong as on Earth—but because the station falls sideways around Earth at 27,600 km/h, matching Earth’s curve.',
    mainParts: [
      { label: 'Centrifugal ring', role: 'Optional rotating habitat ring creating outward apparent gravity via spin.' },
      { label: 'Microgravity hub', role: 'Central docking axis where free-fall conditions remain near zero.' },
      { label: 'Thermal radiator', role: 'White ammonia-cooled fins dumping heat via infrared radiation into space.' },
      { label: 'Whipple micrometeoroid shield', role: 'Spaced outer bumper vaporizing tiny high-speed debris before main hull contact.' },
      { label: 'Airlock bulkhead', role: 'Dual-door pressure seal conserving cabin oxygen during EVA exits.' },
    ],
    whyImportant:
      'Orbital habitats test closed-loop water recycling, microgravity medicine, Earth climate observation, and deep-space propulsion.',
    importantFacts: [
      'Because space is a vacuum, fans alone cannot cool equipment—heat can only leave a spacecraft by radiating infrared light.',
      'A 1 cm aluminum fleck in orbit carries the kinetic energy of a bowling ball at 100 km/h.',
      'Spinning a 100-meter-radius ring at ~3 RPM generates ~1g of artificial gravity along the outer floor.',
    ],
    realScienceSimple:
      'Astronauts float in orbit because their station is falling sideways just as fast as Earth curves away underneath it. Outer shields block tiny space rocks and radiators release heat.',
    realScienceAdvanced:
      'Artificial gravity scales as a_c = ω²r; meanwhile Whipple shields exploit hypervelocity shock physics (>7 km/s), turning solid impactors into dispersed plasma clouds over an empty standoff gap.',
    gameLoreFictional:
      'GAME FICTION: Orbital Ring B (Chapter 11) uses a partial spin ring and microgravity transit hubs—now crawled over by metallic tendrils surging up from hijacked ground-to-orbit relays.',
    narrationScript:
      'Space stations float in microgravity because they travel sideways at nearly 28,000 kilometers per hour, falling around Earth continuously. Spaced Whipple shields shatter tiny micrometeoroids on impact, airlocks hold breathable pressure inside, and radiator wings glow infrared to dump waste heat into the vacuum.',
    relatedLevels: [9, 11],
  },
  {
    id: 'edu_signal_math',
    subjectName: 'Inverse-Square Law & Signal Propagation',
    category: 'Mathematics',
    diagramType: 'math_wave',
    whatIsIt:
      'A mathematical law describing how light, radio waves, gravity, and sound spread thinner across growing spherical areas as distance doubles.',
    whatDoesItDo:
      'Allows engineers to calculate exact dish sizes, transmitter wattage, and receiver sensitivity needed to communicate across continents or light-years.',
    howDoesItWork:
      'Energy radiating evenly from a point expands over the surface area of a sphere (4πr²). Doubling the distance r stretches the exact same signal power across 2² = 4 times the area, cutting intensity to 1/4 (25%). Tripling distance drops it to 1/9.',
    mainParts: [
      { label: 'Transmitter source', role: 'Origin point emitting total radiant or radio power P.' },
      { label: 'Wavefront sphere', role: 'Expanding spherical shell whose surface area equals 4πr².' },
      { label: 'Radius r', role: 'Baseline distance carrying full reference intensity I.' },
      { label: 'Radius 2r (1/4 intensity)', role: 'Double distance where the same energy covers 4× area (I / 4).' },
      { label: 'Receiver dish', role: 'Curved reflector collecting a wide aperture of faint waves to a focal point.' },
    ],
    whyImportant:
      'This single geometric ratio governs spacecraft telemetry (like Voyager billions of kilometers away), Wi-Fi coverage, headlight brightness, and radiation safety.',
    importantFacts: [
      'Voyager 1 signals travel over 24 billion km and arrive at Earth with less than 10⁻¹⁶ watts of power—requiring huge 70-meter dishes to decode.',
      'Parabolic dishes work in reverse too: placing a feed horn at the focus beams waves in a tight parallel line instead of all directions.',
      'Inverse-square geometry appears wherever flux is conserved across 3D space.',
    ],
    realScienceSimple:
      'As a radio signal or flashlight beam moves away, it spreads out like an inflating balloon. Twice as far means the same energy covers four times the space, so it is one-quarter as strong.',
    realScienceAdvanced:
      'Intensity I(r) = P / (4πr²). Logarithmic link budgets express this attenuation in decibels: FSPL(dB) = 20 log₁₀(d) + 20 log₁₀(f) + constant, guiding antenna gain and error-correction coding.',
    gameLoreFictional:
      'GAME FICTION: To overcome the inverse-square drop across galaxies, THEY linked dozens of Earth’s orbital satellites into a synchronized phased-array emitter—boosting gain millions of times.',
    narrationScript:
      'Mathematics explains why distant signals grow faint. Because radio waves expand outward across a sphere of area four pi r squared, doubling your distance spreads the exact same power over four times the area—leaving only one-quarter the strength. Focusing parabolic dishes concentrates that signal toward deep space.',
    relatedLevels: [10, 11],
  },
  {
    id: 'edu_climate_biosphere',
    subjectName: 'Carbon Cycle & Ecological Recovery',
    category: 'Environmental science',
    diagramType: 'environment',
    whatIsIt:
      'The natural exchange of carbon, water, and nutrients between Earth’s atmosphere, forests, soil microbes, and freshwater watersheds.',
    whatDoesItDo:
      'Purifies rainwater, rebuilds fertile topsoil, stabilizes atmospheric greenhouse gases, and heals degraded industrial landscapes over time.',
    howDoesItWork:
      'Plants absorb atmospheric CO₂ and convert it into biomass; falling leaves feed decomposer fungi and bacteria that lock organic carbon into dark topsoil while roots filter heavy runoff before it reaches rivers.',
    mainParts: [
      { label: 'Carbon sink canopy', role: 'Forest leaves drawing CO₂ from air and shading cooling ground layers.' },
      { label: 'Topsoil microbiome', role: 'Fungi and microbes breaking leaf litter into rich humus nutrients.' },
      { label: 'Runoff filtration', role: 'Root mats trapping sediment and neutralizing acidic rainwater.' },
      { label: 'Solar radiation balance', role: 'Cloud, canopy, and ground reflection regulating surface heat.' },
      { label: 'Clean watershed', role: 'Filtered groundwater feeding streams, aquifers, and wetlands.' },
    ],
    whyImportant:
      'Healthy watersheds and forests regulate floods, purify drinking water naturally, and buffer planetary climate extremes.',
    importantFacts: [
      'A single teaspoon of healthy forest soil contains more microscopic organisms than there are people on Earth.',
      'Wetlands and root networks act like giant sponges, reducing downstream flood peaks by up to 60%.',
      'Without industrial smokestacks, urban air particulates settle out within days to weeks via rainfall.',
    ],
    realScienceSimple:
      'Trees pull carbon from the air, soil microbes turn dead leaves into rich dirt, and plant roots clean rainwater before it flows into rivers.',
    realScienceAdvanced:
      'Terrestrial net primary productivity (NPP) sequesters ~2–3 Pg C/year; mycorrhizal glomalin binds soil aggregates, raising hydraulic conductivity and cation-exchange capacity.',
    gameLoreFictional:
      'GAME FICTION: Three years after humanity’s grids went silent (3059–3062), atmospheric soot cleared and forests surged back across crumbling highways—creating an eerie green world haunted only by metallic monsters.',
    narrationScript:
      'Environmental science tracks how ecosystems heal themselves. Forest canopies capture atmospheric carbon, soil microbes recycle dead leaves into rich humus, and deep root networks filter rainwater into clean watersheds. Even when human cities fall quiet, these living nutrient cycles keep working.',
    relatedLevels: [1, 7, 8],
  },
  {
    id: 'edu_reactor_core',
    subjectName: 'Thermal Reactor Core & Control Rods',
    category: 'Physics',
    diagramType: 'reactor',
    whatIsIt:
      'A shielded energy chamber where controlled thermal reactions heat pressurized coolant to spin steam turbines and generate massive baseline power.',
    whatDoesItDo:
      'Produces reliable continuous electricity independent of weather or sunlight by carefully regulating heat release inside thick containment barriers.',
    howDoesItWork:
      'Heavy nuclei (such as uranium-235) split when struck by slow neutrons, releasing heat and more neutrons. Neutron-absorbing control rods slide between fuel assemblies to speed up, steady, or instantly shut down ("scram") the reaction.',
    mainParts: [
      { label: 'Fuel rods', role: 'Ceramic pellets stacked in zirconium tubes releasing controlled thermal energy.' },
      { label: 'Control rods', role: 'Boron or cadmium rods raised or dropped to absorb excess neutrons.' },
      { label: 'Primary coolant loop', role: 'Pressurized water or liquid metal carrying heat out of the core.' },
      { label: 'Heat exchanger', role: 'Isolated steam generator keeping core fluid separate from outer turbines.' },
      { label: 'Containment vessel', role: 'Meter-thick steel and reinforced concrete dome sealing radiation inside.' },
    ],
    whyImportant:
      'Understanding thermal loops, moderators, and failsafe control rods makes high-density clean baseload energy and propulsion safe.',
    importantFacts: [
      'Gravity-driven "SCRAM" systems drop control rods automatically if power fails, stopping chain reactions in under 2 seconds.',
      'One uranium pellet the size of a fingertip stores roughly as much energy as a full ton of coal.',
      'Separate primary and secondary water loops keep turbine steam completely non-radioactive.',
    ],
    realScienceSimple:
      'Fuel rods create steady heat inside a thick safety dome. Sliding control rods absorb particles to slow heat down or turn it off, while coolant water carries heat out to spin turbines.',
    realScienceAdvanced:
      'Criticality factor k_eff = 1 maintains steady-state chain reaction. Negative void and Doppler temperature coefficients ensure inherent passive damping if core temperature rises.',
    gameLoreFictional:
      'GAME FICTION: Station 11’s Aether Reactor pairs real pressurized thermal heat-exchangers with a fictional containment ring—forcing survivors to stabilize cooling before core meltdown.',
    narrationScript:
      'Thermal power reactors release huge energy inside armored containment domes. Fuel rods generate heat, boron control rods slide in to absorb neutrons and govern power level, and pressurized primary coolant transfers heat across sealed exchangers to drive turbines safely.',
    relatedLevels: [10, 11, 12],
  },
  {
    id: 'edu_deep_geology',
    subjectName: 'Impact Craters & Crustal Rock Strata',
    category: 'Environmental science',
    diagramType: 'geology',
    whatIsIt:
      'Layered Earth crust formations shaped over millions of years by sediment deposition, groundwater flow, and rare hypervelocity meteoroid impacts.',
    whatDoesItDo:
      'Records Earth’s geological timeline like stone book pages while impact craters fracture deep rock and expose buried mineral veins.',
    howDoesItWork:
      'When a large meteorite strikes crust at 15–20 km/s, shockwaves excavate a bowl-shaped crater, melt rock into glassy ejecta, and crush surrounding stone into angular fragments known as impact breccia.',
    mainParts: [
      { label: 'Impact crater rim', role: 'Uplifted ring of fractured bedrock pushed outward by shock compression.' },
      { label: 'Shocked breccia layer', role: 'Crushed, fused angular rock fragments formed inside high-pressure impacts.' },
      { label: 'Sedimentary rock', role: 'Horizontal layers of compressed sand, clay, and ancient mineral deposits.' },
      { label: 'Groundwater table', role: 'Permeable porous rock storing subterranean freshwater aquifers.' },
      { label: 'Bedrock mantle', role: 'Dense crystalline foundation rock beneath loose soil and sediment.' },
    ],
    whyImportant:
      'Impact geology reveals Earth’s history of mass extinctions, asteroid defense needs, and deep mineral ore formation (such as Canada’s Sudbury Basin).',
    importantFacts: [
      'A crater is typically 10 to 20 times wider than the meteorite that carved it.',
      'Sudbury Crater’s ancient impact melted crustal rock, concentrating vast nickel and platinum-group metal deposits.',
      'Over 190 confirmed impact structures exist on Earth, though erosion and oceans hide many older craters.',
    ],
    realScienceSimple:
      'Rock layers stack up over millions of years like pages in a book. When a big space rock hits, its shockwave blasts out a bowl-shaped crater and crushes stone into jagged breccia.',
    realScienceAdvanced:
      'Shock metamorphism (>10 GPa) forms shatter cones and planar deformation features in quartz grains—diagnostic mineral fingerprints confirming extraterrestrial hypervelocity impact.',
    gameLoreFictional:
      'GAME FICTION: Chapter 12’s Chamber Zero sits inside the primordial breach crater—where the largest 3059 meteor punched down into metallic ore veins and seeded the Origin Spire.',
    narrationScript:
      'Geology reads Earth’s history in stacked layers of stone. When a fast meteorite strikes, shock compression blasts out an uplifted rim and welds broken stone into impact breccia, exposing deep mineral strata and groundwater beds.',
    relatedLevels: [1, 5, 12],
  },
  {
    id: 'edu_neural_network',
    subjectName: 'Network Firewalls & Intrusion Security',
    category: 'Technology',
    diagramType: 'firewall',
    whatIsIt:
      'A defensive software and hardware barrier that inspects incoming digital traffic, blocks unauthorized access, and isolates compromised subsystems.',
    whatDoesItDo:
      'Verifies user identity tokens, detects abnormal packet bursts in real time, and quarantines hostile intrusion attempts before attackers seize root control.',
    howDoesItWork:
      'Every network message is broken into packets with headers and cryptographic signatures. A firewall compares packets against strict allow-lists, verifies rotating challenge-response sequences, and drops unverified commands.',
    mainParts: [
      { label: 'Packet inspector', role: 'Deep filter scanning incoming network headers and command payloads.' },
      { label: 'Auth token gate', role: 'Cryptographic handshake proving a human or trusted node is genuine.' },
      { label: 'Encrypted tunnel', role: 'Scrambled data channel preventing eavesdropping or tampering in transit.' },
      { label: 'Anomaly engine', role: 'Pattern monitor flagging sudden brute-force spikes or Rogue AI probes.' },
      { label: 'Quarantine sandbox', role: 'Isolated memory jail locking suspicious code away from core controls.' },
    ],
    whyImportant:
      'Hospitals, power grids, satellites, and everyday devices rely on cryptographic authentication and anomaly monitoring to stop cyberattacks.',
    importantFacts: [
      'Modern AES-256 encryption has more possible keys than atoms in the observable universe, making brute-force guessing impossible.',
      'Multi-factor authentication (MFA) stops over 99% of automated credential-stuffing attacks.',
      'Air-gapping—physically disconnecting critical controls from public networks—remains the strongest defense for reactors and dams.',
    ],
    realScienceSimple:
      'A firewall works like a security checkpoint for computer data: it inspects every digital packet, checks secret passwords, and locks suspicious programs into a safe jail.',
    realScienceAdvanced:
      'Zero-trust architectures enforce continuous mutual TLS (mTLS) verification and behavioral sequence challenges so stolen session tokens cannot pivot across segmented subnets.',
    gameLoreFictional:
      'GAME FICTION: As you explore abandoned facilities, the hijacked HELIOS network launches unpredictable Rogue AI intrusion probes—forcing you to clear visual verification sequences before security lockouts drain your suit shields.',
    narrationScript:
      'Cybersecurity firewalls defend critical systems by inspecting every incoming packet, validating encrypted authentication keys, and isolating anomalies inside a sandbox. When HELIOS probes your tactical suit, solving sequence verification locks the Rogue AI back out.',
    relatedLevels: [1, 3, 6, 9, 10],
  },
];

export const EDUCATIONAL_BY_ID: Record<string, EducationalEntryDef> = Object.fromEntries(
  EDUCATIONAL_ENTRIES.map((e) => [e.id, e])
);
