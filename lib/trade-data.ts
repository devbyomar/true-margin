// ============================================================
// TrueMargin — Trade-Specific Data
// Per-trade material suggestions, phase templates, description
// presets, and units. Used for smart combobox dropdowns.
// ============================================================

import type { CostCategory, UnitType } from "@/types";

// ---- Common material/description suggestions per trade ----

export interface TradeSuggestion {
  description: string;
  category: CostCategory;
  defaultUnit: UnitType;
  defaultUnitPrice?: number;
}

/**
 * Common items & descriptions grouped by trade type.
 * Used in estimate builder and cost entry forms as combobox suggestions.
 * Users can also type free-text.
 */
export const TRADE_SUGGESTIONS: Record<string, TradeSuggestion[]> = {
  // ---- HVAC ----
  hvac_install: [
    { description: "Furnace unit", category: "materials", defaultUnit: "each" },
    { description: "Air conditioner unit", category: "materials", defaultUnit: "each" },
    { description: "Heat pump", category: "materials", defaultUnit: "each" },
    { description: "Ductwork — supply", category: "materials", defaultUnit: "lnft" },
    { description: "Ductwork — return", category: "materials", defaultUnit: "lnft" },
    { description: "Duct insulation", category: "materials", defaultUnit: "rolls" },
    { description: "Thermostat", category: "materials", defaultUnit: "each" },
    { description: "Refrigerant line set", category: "materials", defaultUnit: "lnft" },
    { description: "Condensate pump", category: "materials", defaultUnit: "each" },
    { description: "Venting — PVC", category: "materials", defaultUnit: "lnft" },
    { description: "Gas piping", category: "materials", defaultUnit: "lnft" },
    { description: "Filter rack", category: "materials", defaultUnit: "each" },
    { description: "Registers & grilles", category: "materials", defaultUnit: "each" },
    { description: "Sheet metal fittings", category: "materials", defaultUnit: "each" },
    { description: "Electrical hookup", category: "subcontractor", defaultUnit: "each" },
    { description: "Permit — HVAC", category: "other", defaultUnit: "each" },
    { description: "Crane rental", category: "equipment", defaultUnit: "days" },
    { description: "HVAC installation labour", category: "labour", defaultUnit: "hours" },
    { description: "Duct sealing (mastic)", category: "materials", defaultUnit: "each" },
    { description: "Pad / equipment stand", category: "materials", defaultUnit: "each" },
  ],
  hvac_service: [
    { description: "Diagnostic / service call", category: "labour", defaultUnit: "hours" },
    { description: "Blower motor", category: "materials", defaultUnit: "each" },
    { description: "Capacitor", category: "materials", defaultUnit: "each" },
    { description: "Igniter", category: "materials", defaultUnit: "each" },
    { description: "Control board", category: "materials", defaultUnit: "each" },
    { description: "Refrigerant recharge", category: "materials", defaultUnit: "each" },
    { description: "Air filter", category: "materials", defaultUnit: "each" },
    { description: "Fan belt", category: "materials", defaultUnit: "each" },
    { description: "Thermocouple", category: "materials", defaultUnit: "each" },
    { description: "Contactor", category: "materials", defaultUnit: "each" },
    { description: "Drain pan", category: "materials", defaultUnit: "each" },
    { description: "Service labour", category: "labour", defaultUnit: "hours" },
  ],

  // ---- PLUMBING ----
  plumbing: [
    { description: "Copper pipe", category: "materials", defaultUnit: "lnft" },
    { description: "PEX pipe", category: "materials", defaultUnit: "lnft" },
    { description: "ABS pipe", category: "materials", defaultUnit: "lnft" },
    { description: "PVC pipe", category: "materials", defaultUnit: "lnft" },
    { description: "Pipe fittings (copper)", category: "materials", defaultUnit: "each" },
    { description: "Pipe fittings (PEX)", category: "materials", defaultUnit: "each" },
    { description: "Shut-off valves", category: "materials", defaultUnit: "each" },
    { description: "Water heater", category: "materials", defaultUnit: "each" },
    { description: "Tankless water heater", category: "materials", defaultUnit: "each" },
    { description: "Toilet", category: "materials", defaultUnit: "each" },
    { description: "Sink — kitchen", category: "materials", defaultUnit: "each" },
    { description: "Sink — bathroom", category: "materials", defaultUnit: "each" },
    { description: "Faucet", category: "materials", defaultUnit: "each" },
    { description: "Bathtub", category: "materials", defaultUnit: "each" },
    { description: "Shower valve", category: "materials", defaultUnit: "each" },
    { description: "Garbage disposal", category: "materials", defaultUnit: "each" },
    { description: "Sump pump", category: "materials", defaultUnit: "each" },
    { description: "Backflow preventer", category: "materials", defaultUnit: "each" },
    { description: "Drain cleaning", category: "labour", defaultUnit: "hours" },
    { description: "Permit — plumbing", category: "other", defaultUnit: "each" },
    { description: "Plumbing labour", category: "labour", defaultUnit: "hours" },
    { description: "Solder & flux", category: "materials", defaultUnit: "each" },
  ],

  // ---- ELECTRICAL ----
  electrical: [
    { description: "Electrical panel", category: "materials", defaultUnit: "each" },
    { description: "Breaker", category: "materials", defaultUnit: "each" },
    { description: "Romex wire (14/2)", category: "materials", defaultUnit: "lnft" },
    { description: "Romex wire (12/2)", category: "materials", defaultUnit: "lnft" },
    { description: "Conduit — EMT", category: "materials", defaultUnit: "lnft" },
    { description: "Outlet box", category: "materials", defaultUnit: "each" },
    { description: "Switch box", category: "materials", defaultUnit: "each" },
    { description: "Receptacle", category: "materials", defaultUnit: "each" },
    { description: "Light switch", category: "materials", defaultUnit: "each" },
    { description: "GFCI outlet", category: "materials", defaultUnit: "each" },
    { description: "Light fixture", category: "materials", defaultUnit: "each" },
    { description: "Recessed light", category: "materials", defaultUnit: "each" },
    { description: "Ceiling fan", category: "materials", defaultUnit: "each" },
    { description: "EV charger install", category: "materials", defaultUnit: "each" },
    { description: "Smoke detector", category: "materials", defaultUnit: "each" },
    { description: "Wire connectors & staples", category: "materials", defaultUnit: "boxes" },
    { description: "Permit — electrical", category: "other", defaultUnit: "each" },
    { description: "Electrical labour", category: "labour", defaultUnit: "hours" },
    { description: "Inspection fee", category: "other", defaultUnit: "each" },
  ],

  // ---- ROOFING ----
  roofing: [
    { description: "Asphalt shingles", category: "materials", defaultUnit: "bundles" },
    { description: "Underlayment (felt)", category: "materials", defaultUnit: "rolls" },
    { description: "Ice & water shield", category: "materials", defaultUnit: "rolls" },
    { description: "Drip edge", category: "materials", defaultUnit: "lnft" },
    { description: "Ridge cap shingles", category: "materials", defaultUnit: "bundles" },
    { description: "Roof vents", category: "materials", defaultUnit: "each" },
    { description: "Plywood sheathing", category: "materials", defaultUnit: "sheets" },
    { description: "Roofing nails", category: "materials", defaultUnit: "boxes" },
    { description: "Flashing — aluminum", category: "materials", defaultUnit: "lnft" },
    { description: "Step flashing", category: "materials", defaultUnit: "each" },
    { description: "Pipe boot", category: "materials", defaultUnit: "each" },
    { description: "Skylight flashing kit", category: "materials", defaultUnit: "each" },
    { description: "Dumpster rental", category: "equipment", defaultUnit: "each" },
    { description: "Tear-off labour", category: "labour", defaultUnit: "hours" },
    { description: "Install labour", category: "labour", defaultUnit: "hours" },
    { description: "Soffit & fascia", category: "materials", defaultUnit: "lnft" },
    { description: "Eavestrough / gutters", category: "materials", defaultUnit: "lnft" },
    { description: "Permit — roofing", category: "other", defaultUnit: "each" },
  ],

  // ---- FLOORING ----
  flooring: [
    { description: "Hardwood flooring", category: "materials", defaultUnit: "sqft" },
    { description: "Engineered hardwood", category: "materials", defaultUnit: "sqft" },
    { description: "Laminate flooring", category: "materials", defaultUnit: "sqft" },
    { description: "Luxury vinyl plank (LVP)", category: "materials", defaultUnit: "sqft" },
    { description: "Vinyl sheet", category: "materials", defaultUnit: "sqft" },
    { description: "Ceramic tile", category: "materials", defaultUnit: "sqft" },
    { description: "Porcelain tile", category: "materials", defaultUnit: "sqft" },
    { description: "Carpet", category: "materials", defaultUnit: "sqft" },
    { description: "Carpet underpad", category: "materials", defaultUnit: "sqft" },
    { description: "Floor levelling compound", category: "materials", defaultUnit: "bags" },
    { description: "Underlayment foam", category: "materials", defaultUnit: "rolls" },
    { description: "Transition strips", category: "materials", defaultUnit: "each" },
    { description: "Quarter round / trim", category: "materials", defaultUnit: "lnft" },
    { description: "Baseboards", category: "materials", defaultUnit: "lnft" },
    { description: "Thinset mortar", category: "materials", defaultUnit: "bags" },
    { description: "Grout", category: "materials", defaultUnit: "bags" },
    { description: "Floor adhesive", category: "materials", defaultUnit: "gallons" },
    { description: "Tile spacers", category: "materials", defaultUnit: "bags" },
    { description: "Floor sanding (refinish)", category: "labour", defaultUnit: "sqft" },
    { description: "Stain & finish", category: "materials", defaultUnit: "gallons" },
    { description: "Flooring installation labour", category: "labour", defaultUnit: "hours" },
    { description: "Demolition — old flooring", category: "labour", defaultUnit: "sqft" },
    { description: "Floor prep labour", category: "labour", defaultUnit: "hours" },
  ],

  // ---- PAINTING ----
  painting: [
    { description: "Interior paint — walls", category: "materials", defaultUnit: "gallons" },
    { description: "Interior paint — trim", category: "materials", defaultUnit: "gallons" },
    { description: "Exterior paint", category: "materials", defaultUnit: "gallons" },
    { description: "Primer", category: "materials", defaultUnit: "gallons" },
    { description: "Ceiling paint", category: "materials", defaultUnit: "gallons" },
    { description: "Stain (deck / fence)", category: "materials", defaultUnit: "gallons" },
    { description: "Caulking", category: "materials", defaultUnit: "each" },
    { description: "Painter's tape", category: "materials", defaultUnit: "rolls" },
    { description: "Drop cloths", category: "materials", defaultUnit: "each" },
    { description: "Rollers & brushes", category: "materials", defaultUnit: "each" },
    { description: "Sanding supplies", category: "materials", defaultUnit: "each" },
    { description: "Patching compound", category: "materials", defaultUnit: "each" },
    { description: "Scaffolding rental", category: "equipment", defaultUnit: "days" },
    { description: "Pressure washing", category: "labour", defaultUnit: "hours" },
    { description: "Surface prep labour", category: "labour", defaultUnit: "hours" },
    { description: "Painting labour", category: "labour", defaultUnit: "hours" },
  ],

  // ---- LANDSCAPING ----
  landscaping: [
    { description: "Topsoil", category: "materials", defaultUnit: "tonnes" },
    { description: "Sod", category: "materials", defaultUnit: "sqft" },
    { description: "Grass seed", category: "materials", defaultUnit: "bags" },
    { description: "Mulch", category: "materials", defaultUnit: "tonnes" },
    { description: "River stone / gravel", category: "materials", defaultUnit: "tonnes" },
    { description: "Paving stones / pavers", category: "materials", defaultUnit: "sqft" },
    { description: "Interlocking base material", category: "materials", defaultUnit: "tonnes" },
    { description: "Polymeric sand", category: "materials", defaultUnit: "bags" },
    { description: "Retaining wall blocks", category: "materials", defaultUnit: "each" },
    { description: "Landscape fabric", category: "materials", defaultUnit: "rolls" },
    { description: "Edging", category: "materials", defaultUnit: "lnft" },
    { description: "Trees / shrubs", category: "materials", defaultUnit: "each" },
    { description: "Perennials / annuals", category: "materials", defaultUnit: "each" },
    { description: "Irrigation supplies", category: "materials", defaultUnit: "each" },
    { description: "Drainage pipe", category: "materials", defaultUnit: "lnft" },
    { description: "Excavation", category: "labour", defaultUnit: "hours" },
    { description: "Bobcat / skid steer rental", category: "equipment", defaultUnit: "days" },
    { description: "Landscaping labour", category: "labour", defaultUnit: "hours" },
    { description: "Delivery fee", category: "other", defaultUnit: "each" },
  ],

  // ---- CONCRETE ----
  concrete: [
    { description: "Ready-mix concrete", category: "materials", defaultUnit: "loads" },
    { description: "Rebar", category: "materials", defaultUnit: "lnft" },
    { description: "Wire mesh", category: "materials", defaultUnit: "sheets" },
    { description: "Concrete forms", category: "materials", defaultUnit: "lnft" },
    { description: "Form release agent", category: "materials", defaultUnit: "gallons" },
    { description: "Expansion joint", category: "materials", defaultUnit: "lnft" },
    { description: "Concrete sealer", category: "materials", defaultUnit: "gallons" },
    { description: "Gravel base", category: "materials", defaultUnit: "tonnes" },
    { description: "Concrete pump truck", category: "equipment", defaultUnit: "each" },
    { description: "Excavation & grading", category: "labour", defaultUnit: "hours" },
    { description: "Forming labour", category: "labour", defaultUnit: "hours" },
    { description: "Pour & finish labour", category: "labour", defaultUnit: "hours" },
    { description: "Stamped concrete (colour)", category: "materials", defaultUnit: "each" },
    { description: "Permit — concrete", category: "other", defaultUnit: "each" },
  ],

  // ---- FRAMING ----
  framing: [
    { description: "Lumber — 2×4", category: "materials", defaultUnit: "lnft" },
    { description: "Lumber — 2×6", category: "materials", defaultUnit: "lnft" },
    { description: "Lumber — 2×8", category: "materials", defaultUnit: "lnft" },
    { description: "Lumber — 2×10", category: "materials", defaultUnit: "lnft" },
    { description: "Lumber — 2×12", category: "materials", defaultUnit: "lnft" },
    { description: "Plywood sheathing — 1/2\"", category: "materials", defaultUnit: "sheets" },
    { description: "Plywood sheathing — 3/4\"", category: "materials", defaultUnit: "sheets" },
    { description: "OSB sheathing", category: "materials", defaultUnit: "sheets" },
    { description: "LVL beam", category: "materials", defaultUnit: "lnft" },
    { description: "Joist hangers", category: "materials", defaultUnit: "each" },
    { description: "Simpson ties & brackets", category: "materials", defaultUnit: "each" },
    { description: "Nails (framing)", category: "materials", defaultUnit: "boxes" },
    { description: "Construction screws", category: "materials", defaultUnit: "boxes" },
    { description: "House wrap (Tyvek)", category: "materials", defaultUnit: "rolls" },
    { description: "Framing labour", category: "labour", defaultUnit: "hours" },
    { description: "Permit — building", category: "other", defaultUnit: "each" },
    { description: "Engineering plans", category: "subcontractor", defaultUnit: "each" },
  ],

  // ---- DRYWALL ----
  drywall: [
    { description: "Drywall sheets — 1/2\"", category: "materials", defaultUnit: "sheets" },
    { description: "Drywall sheets — 5/8\"", category: "materials", defaultUnit: "sheets" },
    { description: "Drywall compound (mud)", category: "materials", defaultUnit: "bags" },
    { description: "Drywall tape", category: "materials", defaultUnit: "rolls" },
    { description: "Drywall screws", category: "materials", defaultUnit: "boxes" },
    { description: "Corner bead", category: "materials", defaultUnit: "lnft" },
    { description: "Sanding screens", category: "materials", defaultUnit: "each" },
    { description: "Primer / sealer", category: "materials", defaultUnit: "gallons" },
    { description: "Drywall hanging labour", category: "labour", defaultUnit: "sheets" },
    { description: "Taping & mudding labour", category: "labour", defaultUnit: "hours" },
    { description: "Sanding labour", category: "labour", defaultUnit: "hours" },
  ],

  // ---- INSULATION ----
  insulation: [
    { description: "Batt insulation — R12", category: "materials", defaultUnit: "bags" },
    { description: "Batt insulation — R20", category: "materials", defaultUnit: "bags" },
    { description: "Batt insulation — R24", category: "materials", defaultUnit: "bags" },
    { description: "Blown-in insulation", category: "materials", defaultUnit: "bags" },
    { description: "Rigid foam board", category: "materials", defaultUnit: "sheets" },
    { description: "Spray foam insulation", category: "subcontractor", defaultUnit: "sqft" },
    { description: "Vapour barrier", category: "materials", defaultUnit: "rolls" },
    { description: "Acoustic sealant", category: "materials", defaultUnit: "each" },
    { description: "Insulation labour", category: "labour", defaultUnit: "hours" },
  ],

  // ---- SIDING ----
  siding: [
    { description: "Vinyl siding", category: "materials", defaultUnit: "sqft" },
    { description: "James Hardie (fibre cement)", category: "materials", defaultUnit: "sqft" },
    { description: "Wood siding", category: "materials", defaultUnit: "sqft" },
    { description: "Aluminium siding", category: "materials", defaultUnit: "sqft" },
    { description: "Siding trim (J-channel)", category: "materials", defaultUnit: "lnft" },
    { description: "Corner posts", category: "materials", defaultUnit: "each" },
    { description: "Soffit panels", category: "materials", defaultUnit: "sqft" },
    { description: "Fascia", category: "materials", defaultUnit: "lnft" },
    { description: "Furring strips", category: "materials", defaultUnit: "lnft" },
    { description: "Siding nails / screws", category: "materials", defaultUnit: "boxes" },
    { description: "Scaffolding rental", category: "equipment", defaultUnit: "days" },
    { description: "Siding installation labour", category: "labour", defaultUnit: "hours" },
    { description: "Demolition — old siding", category: "labour", defaultUnit: "hours" },
  ],

  // ---- WINDOWS & DOORS ----
  windows_doors: [
    { description: "Window — standard", category: "materials", defaultUnit: "each" },
    { description: "Window — picture / bay", category: "materials", defaultUnit: "each" },
    { description: "Patio door", category: "materials", defaultUnit: "each" },
    { description: "Entry door (exterior)", category: "materials", defaultUnit: "each" },
    { description: "Interior door (pre-hung)", category: "materials", defaultUnit: "each" },
    { description: "Door hardware", category: "materials", defaultUnit: "each" },
    { description: "Window casing / trim", category: "materials", defaultUnit: "lnft" },
    { description: "Window flashing tape", category: "materials", defaultUnit: "rolls" },
    { description: "Spray foam (gap seal)", category: "materials", defaultUnit: "each" },
    { description: "Caulking (exterior)", category: "materials", defaultUnit: "each" },
    { description: "Window / door installation labour", category: "labour", defaultUnit: "hours" },
    { description: "Removal — old windows", category: "labour", defaultUnit: "each" },
  ],

  // ---- DEMOLITION ----
  demolition: [
    { description: "Interior demolition", category: "labour", defaultUnit: "hours" },
    { description: "Exterior demolition", category: "labour", defaultUnit: "hours" },
    { description: "Dumpster rental", category: "equipment", defaultUnit: "each" },
    { description: "Dump fees", category: "other", defaultUnit: "loads" },
    { description: "Asbestos testing", category: "subcontractor", defaultUnit: "each" },
    { description: "Asbestos abatement", category: "subcontractor", defaultUnit: "each" },
    { description: "Hazmat disposal", category: "other", defaultUnit: "each" },
    { description: "Demolition labour", category: "labour", defaultUnit: "hours" },
    { description: "Bobcat rental", category: "equipment", defaultUnit: "days" },
    { description: "Permit — demolition", category: "other", defaultUnit: "each" },
  ],

  // ---- BATHROOM RENO ----
  bathroom_reno: [
    { description: "Vanity", category: "materials", defaultUnit: "each" },
    { description: "Vanity countertop", category: "materials", defaultUnit: "each" },
    { description: "Toilet", category: "materials", defaultUnit: "each" },
    { description: "Bathtub", category: "materials", defaultUnit: "each" },
    { description: "Shower base / pan", category: "materials", defaultUnit: "each" },
    { description: "Shower door / enclosure", category: "materials", defaultUnit: "each" },
    { description: "Bathroom faucet", category: "materials", defaultUnit: "each" },
    { description: "Shower valve & trim", category: "materials", defaultUnit: "each" },
    { description: "Tile — floor", category: "materials", defaultUnit: "sqft" },
    { description: "Tile — walls / shower", category: "materials", defaultUnit: "sqft" },
    { description: "Thinset & grout", category: "materials", defaultUnit: "bags" },
    { description: "Cement board (backer)", category: "materials", defaultUnit: "sheets" },
    { description: "Waterproofing membrane", category: "materials", defaultUnit: "each" },
    { description: "Exhaust fan", category: "materials", defaultUnit: "each" },
    { description: "Mirror / medicine cabinet", category: "materials", defaultUnit: "each" },
    { description: "Towel bars & accessories", category: "materials", defaultUnit: "each" },
    { description: "Plumbing sub", category: "subcontractor", defaultUnit: "each" },
    { description: "Electrical sub", category: "subcontractor", defaultUnit: "each" },
    { description: "Bathroom reno labour", category: "labour", defaultUnit: "hours" },
    { description: "Demolition — bathroom", category: "labour", defaultUnit: "hours" },
  ],

  // ---- KITCHEN RENO ----
  kitchen_reno: [
    { description: "Kitchen cabinets", category: "materials", defaultUnit: "each" },
    { description: "Countertop — granite", category: "materials", defaultUnit: "sqft" },
    { description: "Countertop — quartz", category: "materials", defaultUnit: "sqft" },
    { description: "Countertop — laminate", category: "materials", defaultUnit: "lnft" },
    { description: "Kitchen sink", category: "materials", defaultUnit: "each" },
    { description: "Kitchen faucet", category: "materials", defaultUnit: "each" },
    { description: "Backsplash tile", category: "materials", defaultUnit: "sqft" },
    { description: "Cabinet hardware", category: "materials", defaultUnit: "each" },
    { description: "Undercabinet lighting", category: "materials", defaultUnit: "each" },
    { description: "Range hood", category: "materials", defaultUnit: "each" },
    { description: "Garbage disposal", category: "materials", defaultUnit: "each" },
    { description: "Dishwasher hookup", category: "labour", defaultUnit: "each" },
    { description: "Cabinet installation labour", category: "labour", defaultUnit: "hours" },
    { description: "Countertop template & install", category: "subcontractor", defaultUnit: "each" },
    { description: "Plumbing sub", category: "subcontractor", defaultUnit: "each" },
    { description: "Electrical sub", category: "subcontractor", defaultUnit: "each" },
    { description: "Kitchen reno labour", category: "labour", defaultUnit: "hours" },
    { description: "Demolition — kitchen", category: "labour", defaultUnit: "hours" },
  ],

  // ---- BASEMENT FINISHING ----
  basement_finishing: [
    { description: "Framing — basement walls", category: "materials", defaultUnit: "lnft" },
    { description: "Rigid insulation (basement)", category: "materials", defaultUnit: "sheets" },
    { description: "Drywall", category: "materials", defaultUnit: "sheets" },
    { description: "Suspended ceiling grid", category: "materials", defaultUnit: "sqft" },
    { description: "Ceiling tiles", category: "materials", defaultUnit: "each" },
    { description: "Pot lights", category: "materials", defaultUnit: "each" },
    { description: "Flooring (LVP)", category: "materials", defaultUnit: "sqft" },
    { description: "Subfloor panels", category: "materials", defaultUnit: "sqft" },
    { description: "Interior doors", category: "materials", defaultUnit: "each" },
    { description: "Trim & baseboards", category: "materials", defaultUnit: "lnft" },
    { description: "Egress window", category: "materials", defaultUnit: "each" },
    { description: "Bathroom rough-in", category: "subcontractor", defaultUnit: "each" },
    { description: "Electrical sub", category: "subcontractor", defaultUnit: "each" },
    { description: "HVAC extension", category: "subcontractor", defaultUnit: "each" },
    { description: "Permit — basement", category: "other", defaultUnit: "each" },
    { description: "Basement finishing labour", category: "labour", defaultUnit: "hours" },
  ],

  // ---- DECK & FENCE ----
  deck_fence: [
    { description: "Pressure-treated lumber", category: "materials", defaultUnit: "lnft" },
    { description: "Composite decking", category: "materials", defaultUnit: "lnft" },
    { description: "Cedar boards", category: "materials", defaultUnit: "lnft" },
    { description: "Deck posts (4×4)", category: "materials", defaultUnit: "each" },
    { description: "Deck posts (6×6)", category: "materials", defaultUnit: "each" },
    { description: "Joists & beams", category: "materials", defaultUnit: "lnft" },
    { description: "Deck screws", category: "materials", defaultUnit: "boxes" },
    { description: "Joist hangers & brackets", category: "materials", defaultUnit: "each" },
    { description: "Railing system", category: "materials", defaultUnit: "lnft" },
    { description: "Post caps", category: "materials", defaultUnit: "each" },
    { description: "Concrete sonotubes", category: "materials", defaultUnit: "each" },
    { description: "Concrete mix", category: "materials", defaultUnit: "bags" },
    { description: "Fence panels", category: "materials", defaultUnit: "each" },
    { description: "Fence posts", category: "materials", defaultUnit: "each" },
    { description: "Post hole auger rental", category: "equipment", defaultUnit: "days" },
    { description: "Deck / fence stain", category: "materials", defaultUnit: "gallons" },
    { description: "Permit — deck", category: "other", defaultUnit: "each" },
    { description: "Deck / fence labour", category: "labour", defaultUnit: "hours" },
  ],

  // ---- GENERAL RENOVATION ----
  general_renovation: [
    { description: "General labour", category: "labour", defaultUnit: "hours" },
    { description: "Materials — misc", category: "materials", defaultUnit: "each" },
    { description: "Dumpster rental", category: "equipment", defaultUnit: "each" },
    { description: "Permit", category: "other", defaultUnit: "each" },
    { description: "Plumbing sub", category: "subcontractor", defaultUnit: "each" },
    { description: "Electrical sub", category: "subcontractor", defaultUnit: "each" },
    { description: "HVAC sub", category: "subcontractor", defaultUnit: "each" },
    { description: "Demolition labour", category: "labour", defaultUnit: "hours" },
    { description: "Cleanup", category: "labour", defaultUnit: "hours" },
    { description: "Delivery fee", category: "other", defaultUnit: "each" },
  ],

  // ---- FIRE RESTORATION ----
  fire_restoration: [
    { description: "Fire damage assessment", category: "labour", defaultUnit: "hours" },
    { description: "Smoke damage cleaning", category: "labour", defaultUnit: "hours" },
    { description: "Soot removal", category: "labour", defaultUnit: "hours" },
    { description: "Ozone treatment", category: "equipment", defaultUnit: "days" },
    { description: "Air scrubber rental", category: "equipment", defaultUnit: "days" },
    { description: "Dehumidifier rental", category: "equipment", defaultUnit: "days" },
    { description: "Drywall replacement", category: "materials", defaultUnit: "sheets" },
    { description: "Framing repair", category: "materials", defaultUnit: "lnft" },
    { description: "Insulation replacement", category: "materials", defaultUnit: "bags" },
    { description: "Electrical repair", category: "subcontractor", defaultUnit: "each" },
    { description: "Plumbing repair", category: "subcontractor", defaultUnit: "each" },
    { description: "Restoration labour", category: "labour", defaultUnit: "hours" },
    { description: "Content cleaning", category: "labour", defaultUnit: "hours" },
    { description: "Board-up / securing", category: "labour", defaultUnit: "hours" },
  ],

  // ---- WATERPROOFING ----
  waterproofing: [
    { description: "Exterior waterproofing membrane", category: "materials", defaultUnit: "sqft" },
    { description: "Interior waterproofing system", category: "materials", defaultUnit: "lnft" },
    { description: "Weeping tile", category: "materials", defaultUnit: "lnft" },
    { description: "Sump pit & pump", category: "materials", defaultUnit: "each" },
    { description: "Dimple board", category: "materials", defaultUnit: "sqft" },
    { description: "Hydraulic cement", category: "materials", defaultUnit: "bags" },
    { description: "Crack injection (epoxy/urethane)", category: "materials", defaultUnit: "each" },
    { description: "Excavation", category: "labour", defaultUnit: "hours" },
    { description: "Backfill gravel", category: "materials", defaultUnit: "tonnes" },
    { description: "Waterproofing labour", category: "labour", defaultUnit: "hours" },
  ],

  // ---- EXCAVATION ----
  excavation: [
    { description: "Excavation labour", category: "labour", defaultUnit: "hours" },
    { description: "Excavator rental", category: "equipment", defaultUnit: "days" },
    { description: "Dump truck", category: "equipment", defaultUnit: "loads" },
    { description: "Gravel backfill", category: "materials", defaultUnit: "tonnes" },
    { description: "Topsoil", category: "materials", defaultUnit: "tonnes" },
    { description: "Compaction", category: "labour", defaultUnit: "hours" },
    { description: "Dump fees", category: "other", defaultUnit: "loads" },
    { description: "Locate service", category: "other", defaultUnit: "each" },
    { description: "Permit — excavation", category: "other", defaultUnit: "each" },
  ],

  // ---- TILE & MASONRY ----
  tile_masonry: [
    { description: "Ceramic tile", category: "materials", defaultUnit: "sqft" },
    { description: "Porcelain tile", category: "materials", defaultUnit: "sqft" },
    { description: "Natural stone tile", category: "materials", defaultUnit: "sqft" },
    { description: "Mosaic tile", category: "materials", defaultUnit: "sqft" },
    { description: "Thinset mortar", category: "materials", defaultUnit: "bags" },
    { description: "Grout", category: "materials", defaultUnit: "bags" },
    { description: "Cement board (backer)", category: "materials", defaultUnit: "sheets" },
    { description: "Tile spacers", category: "materials", defaultUnit: "bags" },
    { description: "Tile trim / edging", category: "materials", defaultUnit: "lnft" },
    { description: "Sealer", category: "materials", defaultUnit: "each" },
    { description: "Brick / stone veneer", category: "materials", defaultUnit: "sqft" },
    { description: "Mortar mix", category: "materials", defaultUnit: "bags" },
    { description: "Tile / masonry labour", category: "labour", defaultUnit: "hours" },
  ],

  // ---- CARPENTRY ----
  carpentry: [
    { description: "Lumber (general)", category: "materials", defaultUnit: "lnft" },
    { description: "Plywood", category: "materials", defaultUnit: "sheets" },
    { description: "Trim / moulding", category: "materials", defaultUnit: "lnft" },
    { description: "Crown moulding", category: "materials", defaultUnit: "lnft" },
    { description: "Baseboards", category: "materials", defaultUnit: "lnft" },
    { description: "Door casing", category: "materials", defaultUnit: "lnft" },
    { description: "Shelving", category: "materials", defaultUnit: "lnft" },
    { description: "Cabinet (custom)", category: "materials", defaultUnit: "each" },
    { description: "Hardware (hinges, handles)", category: "materials", defaultUnit: "each" },
    { description: "Wood glue & adhesive", category: "materials", defaultUnit: "each" },
    { description: "Finishing nails", category: "materials", defaultUnit: "boxes" },
    { description: "Carpentry labour", category: "labour", defaultUnit: "hours" },
  ],

  // ---- GARAGE DOOR ----
  garage_door: [
    { description: "Garage door (single)", category: "materials", defaultUnit: "each" },
    { description: "Garage door (double)", category: "materials", defaultUnit: "each" },
    { description: "Garage door opener", category: "materials", defaultUnit: "each" },
    { description: "Springs (torsion)", category: "materials", defaultUnit: "each" },
    { description: "Tracks & hardware", category: "materials", defaultUnit: "each" },
    { description: "Weather stripping", category: "materials", defaultUnit: "lnft" },
    { description: "Keypad / remote", category: "materials", defaultUnit: "each" },
    { description: "Garage door installation labour", category: "labour", defaultUnit: "hours" },
    { description: "Removal — old door", category: "labour", defaultUnit: "each" },
  ],

  // ---- SOLAR ----
  solar: [
    { description: "Solar panels", category: "materials", defaultUnit: "each" },
    { description: "Inverter", category: "materials", defaultUnit: "each" },
    { description: "Racking / mounting system", category: "materials", defaultUnit: "each" },
    { description: "Wiring & conduit", category: "materials", defaultUnit: "lnft" },
    { description: "Disconnect switch", category: "materials", defaultUnit: "each" },
    { description: "Meter / monitoring", category: "materials", defaultUnit: "each" },
    { description: "Panel upgrade (electrical)", category: "subcontractor", defaultUnit: "each" },
    { description: "Permit — solar", category: "other", defaultUnit: "each" },
    { description: "Grid connection fee", category: "other", defaultUnit: "each" },
    { description: "Solar installation labour", category: "labour", defaultUnit: "hours" },
    { description: "Roof penetration & flashing", category: "materials", defaultUnit: "each" },
  ],

  // ---- OTHER (generic) ----
  other: [
    { description: "General labour", category: "labour", defaultUnit: "hours" },
    { description: "Materials", category: "materials", defaultUnit: "each" },
    { description: "Subcontractor", category: "subcontractor", defaultUnit: "each" },
    { description: "Equipment rental", category: "equipment", defaultUnit: "days" },
    { description: "Permit", category: "other", defaultUnit: "each" },
    { description: "Delivery fee", category: "other", defaultUnit: "each" },
    { description: "Dumpster rental", category: "equipment", defaultUnit: "each" },
    { description: "Inspection fee", category: "other", defaultUnit: "each" },
    { description: "Cleanup", category: "labour", defaultUnit: "hours" },
  ],
};

// ---- Phase templates per trade ----

export interface PhaseTemplate {
  name: string;
  sortOrder: number;
}

/**
 * Default phases per trade. Users can add/remove/reorder.
 */
export const PHASE_TEMPLATES: Record<string, PhaseTemplate[]> = {
  hvac_install: [
    { name: "Site assessment", sortOrder: 0 },
    { name: "Equipment procurement", sortOrder: 1 },
    { name: "Ductwork rough-in", sortOrder: 2 },
    { name: "Equipment installation", sortOrder: 3 },
    { name: "Electrical hookup", sortOrder: 4 },
    { name: "Testing & commissioning", sortOrder: 5 },
    { name: "Cleanup & handover", sortOrder: 6 },
  ],
  hvac_service: [
    { name: "Diagnosis", sortOrder: 0 },
    { name: "Parts procurement", sortOrder: 1 },
    { name: "Repair", sortOrder: 2 },
    { name: "Testing", sortOrder: 3 },
  ],
  plumbing: [
    { name: "Rough-in", sortOrder: 0 },
    { name: "Fixture installation", sortOrder: 1 },
    { name: "Testing & inspection", sortOrder: 2 },
    { name: "Finishing", sortOrder: 3 },
  ],
  electrical: [
    { name: "Planning & permits", sortOrder: 0 },
    { name: "Rough-in wiring", sortOrder: 1 },
    { name: "Panel work", sortOrder: 2 },
    { name: "Fixture installation", sortOrder: 3 },
    { name: "Inspection", sortOrder: 4 },
  ],
  roofing: [
    { name: "Tear-off", sortOrder: 0 },
    { name: "Deck inspection & repair", sortOrder: 1 },
    { name: "Underlayment & flashing", sortOrder: 2 },
    { name: "Shingle installation", sortOrder: 3 },
    { name: "Cleanup", sortOrder: 4 },
  ],
  flooring: [
    { name: "Demolition — old floor", sortOrder: 0 },
    { name: "Subfloor prep", sortOrder: 1 },
    { name: "Flooring installation", sortOrder: 2 },
    { name: "Trim & finishing", sortOrder: 3 },
  ],
  painting: [
    { name: "Surface prep", sortOrder: 0 },
    { name: "Priming", sortOrder: 1 },
    { name: "Paint — first coat", sortOrder: 2 },
    { name: "Paint — second coat", sortOrder: 3 },
    { name: "Trim & touch-ups", sortOrder: 4 },
  ],
  landscaping: [
    { name: "Site grading", sortOrder: 0 },
    { name: "Hardscaping", sortOrder: 1 },
    { name: "Softscaping", sortOrder: 2 },
    { name: "Irrigation", sortOrder: 3 },
    { name: "Cleanup", sortOrder: 4 },
  ],
  concrete: [
    { name: "Excavation & grading", sortOrder: 0 },
    { name: "Forming", sortOrder: 1 },
    { name: "Rebar & mesh", sortOrder: 2 },
    { name: "Pour & finish", sortOrder: 3 },
    { name: "Curing", sortOrder: 4 },
  ],
  bathroom_reno: [
    { name: "Demolition", sortOrder: 0 },
    { name: "Plumbing rough-in", sortOrder: 1 },
    { name: "Electrical rough-in", sortOrder: 2 },
    { name: "Waterproofing", sortOrder: 3 },
    { name: "Tile work", sortOrder: 4 },
    { name: "Fixture installation", sortOrder: 5 },
    { name: "Finishing & trim", sortOrder: 6 },
  ],
  kitchen_reno: [
    { name: "Demolition", sortOrder: 0 },
    { name: "Plumbing & electrical rough-in", sortOrder: 1 },
    { name: "Drywall & painting", sortOrder: 2 },
    { name: "Cabinet installation", sortOrder: 3 },
    { name: "Countertop install", sortOrder: 4 },
    { name: "Backsplash", sortOrder: 5 },
    { name: "Fixtures & appliance hookup", sortOrder: 6 },
  ],
  basement_finishing: [
    { name: "Planning & permits", sortOrder: 0 },
    { name: "Framing", sortOrder: 1 },
    { name: "Plumbing & electrical rough-in", sortOrder: 2 },
    { name: "Insulation", sortOrder: 3 },
    { name: "Drywall", sortOrder: 4 },
    { name: "Flooring", sortOrder: 5 },
    { name: "Trim & finishing", sortOrder: 6 },
  ],
  deck_fence: [
    { name: "Footings & posts", sortOrder: 0 },
    { name: "Framing", sortOrder: 1 },
    { name: "Decking / panel install", sortOrder: 2 },
    { name: "Railing", sortOrder: 3 },
    { name: "Finishing (stain/seal)", sortOrder: 4 },
  ],
  general_renovation: [
    { name: "Demolition", sortOrder: 0 },
    { name: "Structural work", sortOrder: 1 },
    { name: "Rough-ins (plumbing, electrical, HVAC)", sortOrder: 2 },
    { name: "Drywall & insulation", sortOrder: 3 },
    { name: "Finishes", sortOrder: 4 },
    { name: "Cleanup & handover", sortOrder: 5 },
  ],
  fire_restoration: [
    { name: "Assessment & board-up", sortOrder: 0 },
    { name: "Water extraction", sortOrder: 1 },
    { name: "Smoke & soot removal", sortOrder: 2 },
    { name: "Demolition", sortOrder: 3 },
    { name: "Structural repair", sortOrder: 4 },
    { name: "Rebuild", sortOrder: 5 },
    { name: "Cleaning & deodorizing", sortOrder: 6 },
  ],
};

// ---- Unit display labels ----

export const UNIT_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "each", label: "Each" },
  { value: "hours", label: "Hours" },
  { value: "sqft", label: "Sq Ft" },
  { value: "lnft", label: "Lin Ft" },
  { value: "m2", label: "m²" },
  { value: "m", label: "Metres" },
  { value: "sheets", label: "Sheets" },
  { value: "rolls", label: "Rolls" },
  { value: "bags", label: "Bags" },
  { value: "boxes", label: "Boxes" },
  { value: "tonnes", label: "Tonnes" },
  { value: "loads", label: "Loads" },
  { value: "days", label: "Days" },
  { value: "gallons", label: "Gallons" },
  { value: "litres", label: "Litres" },
  { value: "pieces", label: "Pieces" },
  { value: "bundles", label: "Bundles" },
  { value: "pallets", label: "Pallets" },
] as const;

/**
 * Get suggestions filtered by category for a given trade.
 */
export function getSuggestionsForTrade(
  tradeType: string | null,
  category?: CostCategory
): TradeSuggestion[] {
  const key = tradeType ?? "other";
  const suggestions: TradeSuggestion[] = TRADE_SUGGESTIONS[key] ?? TRADE_SUGGESTIONS.other ?? [];
  if (category) {
    return suggestions.filter((s) => s.category === category);
  }
  return suggestions;
}

/**
 * Get all unique descriptions across all trades for a given category.
 * Useful for a global "description" combobox when no trade type is selected.
 */
export function getAllSuggestionsForCategory(category: CostCategory): string[] {
  const seen = new Set<string>();
  for (const suggestions of Object.values(TRADE_SUGGESTIONS)) {
    for (const s of suggestions) {
      if (s.category === category) {
        seen.add(s.description);
      }
    }
  }
  return Array.from(seen).sort();
}
