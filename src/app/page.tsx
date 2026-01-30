import FilterCard from "@/components/FilterCard";

const filters = [
  {
    title: "Documents",
    count: 124,
    description: "Identify receipts, invoices, and text screenshots.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB91tcsDXQ19KC09NGXmIbpqwFqYVD17h8EvYKsQjbmxJ5RSxC5A4oUBglsM1SQ0OiaZZWW3hOUogCMsV_yNTy6Pkvv8z69mhwBmtQexoeYFSWzuf9xAHd3CCycloVWfGHpjAFYqUf6pQ03FRX-8paH-0jj53_m6r6bOHMo6cB6lQ6PDE-_K5KpdfS8RBzm-xM7hfaqEosLw2CHwCjhJDpZY4nB7aWU-lPbbsa5T-LAge0Z9TUeJY45lCgyns-3GDmBwqfW7zQGP-I",
    icon: "receipt_long",
  },
  {
    title: "Nature",
    count: 856,
    description: "Landscapes, greenery, and outdoor scenery.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDfrpB6yslz-ay2pB-1xAjZj5hJDtwTjwtwJoxRw75nb8tdpWwYj8RWTqJ3gIYJLrKhkYxgeHABl_6UUcV8VXaInwIs_QyB0wvSfFQLPR0TKVPkbaCq_N8grvfGYUG9zfQE8NSGiK1X6eY3ztqRGSJo78Tu4b146w2igX5gEr_7adsn-SqSgF6LHJJpoYrP8d1kaDc_7JZwNNmx70TXgDZl0jUwCiAaU9xS-nMHglFqHPvpAHUoyFGKs24MJDsJSKrZP7eoWNwFSqw",
    icon: "forest",
  },
  {
    title: "Portraits",
    count: 432,
    description: "People, selfies, and group photos.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCZaZzsQF85BDqBUHRMtMJdi-HyVkzCrzkBqQ3MzkhNAWfwzYOyy2OGEXRfMQYoLQHy-GaQ5QOC-9tLoUMO23cauEuenD74-c6f8DTTyV7W354mMKFyxrSTGfim2uMeIEBFye2KVF1x1hJOqWuu0EEES4EJ3WZHQMK7BmbVFtOaugh1roXwt7wW4b4oXN2YkpLFpWd_g4AQNz2Y9z4u81D_NQ7UkzXSgFj8voSO6bcuEOdZh2124hxMcbbv81LpGXUjicutIs09IM4",
    icon: "face",
  },
  {
    title: "Screenshots",
    count: 67,
    description: "Screen captures from devices and web clippings.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB9u8DlbSGIdatz1nS3W0vvskfmab2QJqdj6-zXJGiJIexlCfRzSxAYFgoQnJ03f42RmubpzAPucMgCBYpcVYg6wdblZDwQH9QOCQNzJ38jFDmL26szeVH0xa8nthhi5t33qsw7205q_kjFtpCmCoKghBNTp4AGPGUUTXfqcqRQgP2MjCdmmRk2t_frUXN3YdW5hZXlzNOXFVWzR7o6UrygrWXU2WEw3Py1IRI6sSpvL0vI6i4PMjOf6JSAXa8dbfvLqYPhY9_Iju0",
    icon: "screenshot_monitor",
  },
  {
    title: "Blurry",
    count: 23,
    description: "Low quality or out-of-focus images to review.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBrRm_L2yi9JZMLCc3NGr7o4aqn73aMexZtZa9cvqqimK4-OgXaUKbe04AB4wVHyLmcEROcVnZHCnd9zfbuLvrLwOp3-OxIPcHVe_wdarH2VEjDo6fmcEfl7mVS3_j0lkP8Vf36r9bwLCcKe4GzJGaxw7hOHangHjjajgErb1--RVZv105IS3jFiElz5jpkaslIEMiNEHCacJBInKoKKPc_kCMrWwpA2UVUcVVgF174Rg0YN-A4OiuZvCucWgPNYCG67DJPW5XvGcE",
    icon: "blur_on",
    iconColor: "text-orange-500",
  },
  {
    title: "Food",
    count: 198,
    description: "Meals, recipes, and dining experiences.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC1HKuhxuTsD2VCBmSaUr1UjBhkbO-A5W227soimoLDbeBNB_ZZcMKfzISZ9MvPjCOV15mm0TwxAjLyvZNpqnwnIdizdwkN8j9R3kCR9VnFR33p2OThXzUJE8VQpXRhzWggKu7fd79vxWrbVGFMOO8QsBNTNQ-W5VJ-CgYRNOILLq7bC65sKy0k_JtbJpR8Cz6YTBOkkKHnIFYD-bLPGDsxrFbxhflmWi52GSIcnRI4jAQLvhsKHyrdD2qnd6U-tfVDG0ch20D8jHg",
    icon: "restaurant",
  },
  {
    title: "Architecture",
    count: 342,
    description: "Buildings, cityscapes, and interior design.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCOmgipRDe904et53OIqGd-x-3WcFf9BMfUfISYJyQL-_Gtu3gJEKyFodFwL41tfrGzcPFZuU8Gm9JADvySZb89TrpKedNMWpTF4byEajp2LLTjb2jM_lQA8zuORQRW9NJt-A5uCgojZDGim9XAHdXhAUewcr2X2zOTYziutlhnVoyJc8RIK4cbiQskFN0W61wB_uM_8qAVqIk9CtD7CpTJJ93dWiIBRI9DuIR7nNmlEMZfBjJbhW0RWDFc8eq7i9QVuj5R0injVrw",
    icon: "apartment",
  },
  {
    title: "Animals",
    count: 112,
    description: "Pets, wildlife, and nature creatures.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuApZ9GOI-rMJRs3dfXS4E0QNdjDtXB4utzRJWSJoHnn-qKBEcw2df4N9JtJLqGsb9JG9l1TeTp4A4dcp6GwyGgxpmT5y4bsF9b16HRlPyQ21lxuYfgOWUHvUNS2TZXavrzewC61hCJc40WBxKASP_K_e89w29JHG0DqeZMxMcAAMw1BrxWTdR1dIOHD7fNwvBF_IOC1XTIOa6m7DYYcGis_bXp3Fd99i08gG2iEfIzS0J-89Q6MV_nxA1Sa6ayWubHyyRnpdNlViag",
    icon: "pets",
  },
];

export default function Home() {
  return (
    <div className="max-w-[1200px] mx-auto flex flex-col gap-6">
      {/* Page Heading */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-slate-900 dark:text-white text-3xl md:text-4xl font-black tracking-tight">
            Smart Filters
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-base max-w-xl">
            Find and organize photos by automatically detected categories.
            Review suggestions to keep your library clean.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <span className="material-symbols-outlined text-[18px]">sort</span>
            Sort by Relevance
          </button>
        </div>
      </div>

      {/* Chips/Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button className="flex items-center justify-center h-9 px-4 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium whitespace-nowrap shadow-sm transition-transform active:scale-95">
          Smart Filters
        </button>
        <button className="flex items-center justify-center h-9 px-4 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium whitespace-nowrap transition-colors">
          Themes
        </button>
        <button className="flex items-center justify-center h-9 px-4 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium whitespace-nowrap transition-colors">
          Custom Tags
        </button>
        <button className="flex items-center justify-center h-9 px-4 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium whitespace-nowrap transition-colors">
          Places
        </button>
      </div>

      {/* Filters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filters.map((filter, index) => (
          <FilterCard key={index} {...filter} />
        ))}
      </div>

      {/* Floating Action Button */}
      <button className="fixed bottom-8 right-8 size-14 bg-primary text-white rounded-2xl shadow-lg hover:shadow-primary/50 hover:scale-105 active:scale-95 transition-all flex items-center justify-center z-50 group">
        <span className="material-symbols-outlined text-3xl group-hover:rotate-90 transition-transform duration-300">
          add
        </span>
        <span className="absolute right-full mr-4 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Create Custom Filter
        </span>
      </button>
    </div>
  );
}
