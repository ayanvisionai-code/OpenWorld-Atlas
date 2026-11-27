// US planning allowances. Set a product URL here to override its retail destination.
function product(name, allowance, asin, url) {
  return { name, allowance, url: url || 'https://www.amazon.com/dp/' + asin };
}
const systems = {
  ps: [
    product('PlayStation 5 Digital Edition · 825 GB', 599, 'B0FRGMYJMG'),
    product('PlayStation 5 · 1 TB disc model', 649, 'B0FRGTYSL5'),
    product('PlayStation 5 Pro · 2 TB', 899, 'B0FTMY4YZ2')
  ],
  xbox: [
    product('Xbox Series S · 512 GB', 400, 'B08G9J44ZN'),
    product('Xbox Series X Digital Edition · 1 TB', 600, 'B0DCD9LGHY'),
    product('Xbox Series X · 1 TB disc model', 650, 'B08H75RTZ8')
  ],
  pc: [
    product('CyberPowerPC GXiVR8060A47 · i5-14400F / RTX 5060 / 16 GB / 1 TB', 1200, 'B0DXVDC556'),
    product('Lenovo Legion Tower 5 · Ryzen 7 7800X3D / RTX 5070 / 32 GB / 1 TB', 2100, 'B0GNCFSYY7'),
    product('CyberPowerPC GXiVR8620A9 · Core Ultra 9 / RTX 5080 / 32 GB / 2 TB', 3500, 'B0DXVG8G7K')
  ],
};

const gear = {
  ps: { label: "PlayStation console", models: systems.ps },
  xbox: { label: "Xbox console", models: systems.xbox },
  pc: { label: "Complete gaming tower", models: systems.pc },
  cpu: { label: "Processor", models: [
    product("AMD Ryzen 5 7600", 190, "B0BMQJWBDM"),
    product("AMD Ryzen 7 7700X", 290, "B0BBHHT8LY"),
    product("AMD Ryzen 7 7800X3D", 390, "B0BTZB7F88")
  ] },
  gpu: { label: "Graphics card", models: [
    product("MSI GeForce RTX 4060 Ventus 2X Black 8G OC", 300, "B0C8BPW1SP"),
    product("MSI GeForce RTX 5070 Ventus 2X OC 12GB", 600, "B0DX7JJ87N"),
    product("ASUS Prime GeForce RTX 5070 Ti OC 16GB", 850, "B0DVGVZZYY")
  ] },
  board: { label: "Motherboard", models: [
    product("Gigabyte B650M Gaming X AX", 155, "B0BLFNZZTW"),
    product("ASUS TUF Gaming B650-Plus WiFi", 210, "B0BHJKR3BV"),
    product("ASUS TUF Gaming X870-Plus WiFi", 300, "B0DGQ9C2TH")
  ] },
  ram: { label: "Memory kit", models: [
    product("Teamgroup T-Create Expert 32GB DDR5-6000 CL30", 110, "B0C4NKHXK7"),
    product("G.Skill Flare X5 32GB DDR5-6000 CL30 (2×16GB)", 150, "B0C1TKSDKR"),
    product("Corsair Vengeance 64GB DDR5-6000 (2×32GB)", 260, "B0C5M7J967")
  ] },
  ssd: { label: "SSD storage", models: [
    product("Crucial P3 Plus 1TB NVMe", 85, "B0B25NXWC7"),
    product("Samsung 990 PRO 2TB", 150, "B0BHJJ9Y77"),
    product("Samsung 990 PRO 4TB", 310, "B0CHGT1KFJ")
  ] },
  psu: { label: "Power supply", models: [
    product("Corsair RM750e ATX 3.1", 110, "B0DPR6X7JX"),
    product("Corsair RM850e ATX 3.1", 140, "B0DPR86ZC8"),
    product("Corsair RM1000e ATX 3.1", 180, "B0DPR5RZ1T")
  ] },
  cooler: { label: "CPU cooler", models: [
    product("Thermalright Assassin X 120R Digital ARGB", 25, "B0GK1HG9HG"),
    product("Thermalright Phantom Spirit 120 SE", 45, "B0BNDTJVPL"),
    product("Noctua NH-U12A", 130, "B07PN4RDW3")
  ] },
  case: { label: "Case", models: [
    product("Corsair 3000D Airflow", 80, "B0C2JMTX2J"),
    product("Corsair 4000D Airflow", 110, "B08C7BGV3D"),
    product("Fractal Design North XL", 190, "B0CJCJ3ZZB")
  ] },
  display: { label: "Monitor", models: [
    product("Acer SB220Q bi · 21.5-inch Full HD", 100, "B07CVL2D2S"),
    product("AOC Q27G3XMN · 27-inch QHD mini-LED", 300, "B0C8ZJKPWC"),
    product("Acer Predator X32 X3 · 31.5-inch 4K OLED", 1000, "B0D9PCJ3TR")
  ] },
  mouse: { label: "Mouse", models: [
    product("Logitech G203 Lightsync", 30, "B07YN82X3B"),
    product("Logitech G502 HERO", 50, "B07GBZ4Q68"),
    product("Logitech G Pro X Superlight 2", 150, "B09NBWL8J5")
  ] },
  keyboard: { label: "Keyboard", models: [
    product("Logitech K120 USB", 16, "B003ELVLKU"),
    product("Logitech G413 SE", 75, "B08Z6X4NK3"),
    product("Logitech G915 X Lightspeed", 230, "B0DBVPF52H")
  ] },
  headset: { label: "Headset with microphone", models: [
    product("Razer BlackShark V2 X 3.5mm", 50, "B086PKMZ21"),
    product("HyperX Cloud Alpha wired 3.5mm", 90, "B074NBSF9N"),
    product("Drop + EPOS PC38X wired gaming headset", 180, "B08TX6GQTB")
  ] },
  desk: { label: "Desk", models: [
    product("SHW Home Office 48-inch desk", 90, "B07Q33BDKC"),
    product("IAIB 55-inch L-shaped standing desk", 240, "B0HFLSG499"),
    product("FLEXISPOT Classic 60 × 30 dual-motor standing desk", 520, "B09LCJ2V6G")
  ] },
  chair: { label: "Chair", models: [
    product("Amazon Basics mesh mid-back office chair", 100, "B00IIFW2L4"),
    product("HON Ignition 2.0 mesh chair", 420, "B06Y3PGPYN"),
    product("Steelcase Leap V2 office chair", 1300, "B006H1QYBA")
  ] },
  camera: { label: "USB camera", models: [
    product("Logitech C270 HD", 25, "B004FHO5Y6"),
    product("Logitech C920x HD Pro", 70, "B085TFF7M1"),
    product("Logitech BRIO 4K Pro webcam", 160, "B01N5UOYC4")
  ] },
  psCamera: { label: "PlayStation broadcast camera", models: [
    product("Sony PlayStation 5 HD Camera CFI-ZEY1", 60, "B08FC5V4H9")
  ] },
  mic: { label: "Desktop microphone", models: [
    product("FIFINE K669B USB", 40, "B01MXL3EOU"),
    product("Elgato Wave:3 USB", 150, "B088HHWC47"),
    product("Shure MV7+ USB/XLR", 280, "B0CTJ7PVN1")
  ] },
  light: { label: "Stream lighting", models: [
    product("UBeesize 10-inch LED ring light with stand", 35, "B07QFV72LK"),
    product("Elgato Key Light Neo", 90, "B0CVYD9HB4"),
    product("Elgato Key Light Air", 130, "B082QHRZFW")
  ] },
  capture: { label: "Capture card", models: [
    product("Elgato Game Capture Neo", 120, "B0CVYKQNFH"),
    product("Elgato HD60 X", 180, "B09VDD6TTD"),
    product("Elgato Game Capture 4K X", 250, "B0CPFWXMBL")
  ] }
};
