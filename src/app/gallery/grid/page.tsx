import ImageCard from "@/components/ImageCard";
import Link from "next/link";

const images = [
  {
    title: "mountain_retreat_v2.jpg",
    fileSize: "2.4 MB",
    fileType: "JPG",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCxECostXjN5LwP8p1-8CuE8Mfa7mk4EwNNknQ7Dgd3ToQRA741ML7gQT0eDavMr_pm3hTlpmSuQjPf7NQ8QZ_r7kkSzW8S725_vkAQLERzbeXDv2pcl3vIgeNbe9FbhG-eOz0s5y9K7ur6hMcZeADivchlnf9uBx0CEjHbY2by6c1C171DJ2dvkCemRJuvCv6VaY0Q0udfhcgAimlqHCnn37xTE9dC5YouUUyA5Zz5HDEYXOMiM3vAVqBUsSkO3TspX9Z3T4rA_dY",
    alt: "Scenic mountain landscape in blue tint",
    selected: true,
  },
  {
    title: "urban_planning_draft.png",
    fileSize: "4.1 MB",
    fileType: "PNG",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC4QdHYN06kNlxharRhiRrxAAGrEBWF1eGv-LG5bAbDJtlVcgJRDjevOCzv9llTJjBqik6XApqcrEqx5RcxP00gG6pkpHDC12nIIwVy-_aLbbT7o99PbkK_JwfXoKoLqhvPqESOpYHsyOJThp4SwLCRW7ifoZMClHwIo7gjROJG395iMz0HIrma08cY-ohNl01ITTRlWRI6Ir-0IWgoHbVYHte4o2ndRAmskVyNYDDpEf6Yy7mQObF2wdSSvH4SvJd8Txa6nB2Q598",
    alt: "Modern yellow architectural building detail",
  },
  {
    title: "red_texture_bg.jpg",
    fileSize: "1.2 MB",
    fileType: "JPG",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDHYK0AfNW7NYqLX1On_6F55b7fKDwdXpURp1UMEOh0fTEJirIFRwccg2JYYmD_xwpIXxEfdKvwDuyRbSeJC68CqPNvQ-w1VVqP_sRBIT6dHik0SzWUT4Y1-CXMqRhK65BgJloO19NN-5j9AO2f9cXz-6x_K0oR6juKXIYCpD7UEcRF9sh6GaMppPIguMTM6R4El5noyhZpFPV11qdq0q0CX7w4FywzIXkt7x0ZeS4sKJIkXHlCR14DmEmwTz1R_89YhRAki792Wms",
    alt: "Abstract red geometric shapes pattern",
  },
  {
    title: "forest_texture.png",
    fileSize: "8.5 MB",
    fileType: "PNG",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB5x2k3X3UF2Lr8TIzFhOQrk5P1_L9_4Kwy4s9IFE82dfpd9VATewG1WFNKAUdt72Sx0REzcu98KhcPEhSnN8a1czk78orBAj6c-lauDPddFqOlqT1HeEboMOGtgPxM-1gsBffgW1pQFAi_gxAzVfX3hyH6ZMmbEmyM__giDHNHKINIu4rXqyY5YtlkAJcJpGZmdFiKNqRIAOhc67lESUyRw_xL_30k8OJC4epUu1bXcmMOL4q9ccHI-1IMnU6AnZOHOCIXWpVnch0",
    alt: "Green forest canopy texture",
  },
  {
    title: "app_mockup_v4.jpg",
    fileSize: "500 KB",
    fileType: "JPG",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAZ5acqLHgn2JStn_XCh0DUoNzqHx6rEK94DruSZZFSlBVDuO7eTleJZcQZYIVDgCwPTRs6e6mTihcuguaSbfZQXS51B3Of3rHRZBmExd0FSLEIGJGLaJD8wXhjBpqtv8eoMBfRE-YYxEQTYNFwhxCezx8sY9mxHUMKNkgU-FMDXdJS02XXm_PWcAo6zi9i0bvFcEYMux2rBvejVt9NXMwowYMl5Wy7WLYyAgKVnS5QSILWLl-C97cuEQ8hD0lUBXTe5T8bEpJcLt8",
    alt: "Purple digital wave pattern background",
  },
  {
    title: "sunset_background.jpg",
    fileSize: "3.2 MB",
    fileType: "JPG",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAK9-ZO2NF4SwySvD8M4rbExiD7a-ODsF-s9ISj2vX4jyjQLdI9FrklHR8nCiNM_VIlaikMxCuagPFMwrg-oaYM5k1efvKI0h90j3RbCGKsKiBtVMFKHniT0pgPX07gd16jPZVABa3mxyP7Jq02dXioMw27iHSMRpUdMTW0DDUjHhjbloGoFnS0azKL2gNDnRy3bVWQChuylQIRDUYAHx5R809j4NXrWzyNyDSOTSwu-SEbqSsv_AfXAi3LxbrMWKm1CBuo7R5aj18",
    alt: "Orange sunset gradient over water",
  },
  {
    title: "campaign_shoot_02.raw",
    fileSize: "24 MB",
    fileType: "RAW",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDd4pMoP4k95WvY13Pd-1sy2CaD4svR29RTszSNg87nqtJNGar2TQvm0LJ9TBqKKImZ-137cGUbevv_NZAY0LJA52GWXNPuihWZHB8D6N1UP6ihlvyjPwDIyQvlZiFLu997RBgmTw-9W5sBVsFcMLZ2Z-xQrBJXvDhv4P1dVzYgSplslIkTd5Q1geS3AdCZALnOr6Jih7C25OfSzFZ2UKXD0UuRKM2XYO1sKokoCPYVRqlRuPUzh7WquUxx98iTR0Sa_Q1E3cGzhIQ",
    alt: "Pink fashion shoot close up",
  },
  {
    title: "presentation_bg.png",
    fileSize: "1.1 MB",
    fileType: "PNG",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAwdy3UQ5uFov3KVsH-6AW2UxR-7SV3wD_1SpiEO1bqa2Y6cn2hy8CYiQ8QR1TCXEQL8_-rKTf4fANxZUDAj1A2I3AdKxBJRlYuj2ulJmRI22Ct-AB975g-YOp6IpTY3dF0UJ2lsxF87Pp452s2HC8iYkW0elqzjmn49qEKacJVSPkDsLLvIRdOVKQdGQYayKnv4pHM2kxXnItwpg4sii2JaZ2t_jYVrFr3lEY43pydys-_O6XRs1__aKuPKFW93HsWBurKiEy_v0w",
    alt: "Teal geometric abstract pattern",
  },
];

export default function GalleryGrid() {
  return (
    <div className="w-full max-w-[1400px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          My Assets
        </h1>
        <button className="flex items-center justify-center gap-2 bg-primary hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-all active:scale-95">
          <span className="material-symbols-outlined text-[20px]">
            cloud_upload
          </span>
          <span>Upload Image</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 mb-8">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
          <div className="relative w-full lg:w-96 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-slate-400">
                search
              </span>
            </div>
            <input
              className="block w-full pl-10 pr-3 py-2.5 border-none rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 sm:text-sm transition-all outline-none"
              placeholder="Search by name, tag, or date..."
              type="text"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap">
                <span>File Type</span>
                <span className="material-symbols-outlined text-[18px]">
                  expand_more
                </span>
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap">
                <span>Date Modified</span>
                <span className="material-symbols-outlined text-[18px]">
                  expand_more
                </span>
              </button>
            </div>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-600 mx-1 hidden sm:block"></div>
            {/* View Options */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <button className="p-1.5 rounded bg-white dark:bg-slate-600 shadow-sm text-primary">
                <span className="material-symbols-outlined text-[20px]">
                  grid_view
                </span>
              </button>
              <Link
                href="/gallery/list"
                className="p-1.5 rounded text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <span className="material-symbols-outlined text-[20px]">
                  view_list
                </span>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">
              <input
                className="form-checkbox w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                type="checkbox"
              />
              Select All
            </label>
            <span className="text-xs text-slate-400 px-2 border-l border-slate-200 dark:border-slate-700">
              124 items
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-400 cursor-not-allowed"
              disabled
            >
              <span className="material-symbols-outlined text-[18px]">
                delete
              </span>
              <span className="hidden sm:inline">Delete</span>
            </button>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-400 cursor-not-allowed"
              disabled
            >
              <span className="material-symbols-outlined text-[18px]">
                download
              </span>
              <span className="hidden sm:inline">Download</span>
            </button>
          </div>
        </div>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {images.map((img, idx) => (
          <ImageCard key={idx} {...img} />
        ))}
      </div>
    </div>
  );
}
