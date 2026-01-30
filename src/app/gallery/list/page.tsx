import Link from "next/link";
import React from "react";

const rows = [
  {
    fileName: "Vacation_Beach.jpg",
    tags: ["Travel", "Summer"],
    date: "Oct 24, 2023",
    size: "2.4 MB",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDN9dILRKSmshu3_ljloirSe97JAbiTN2tJh5qYBcTps4oiwXDNzc3AcUtsvbVvqOsXEGLXebaIy6_GLjU-12PFNHVZn1xHjA6KTSD7bOyjTOCiy3xnWeUQS1Xv2u7wRHu4k1rNHhCzCq62pSHayEGT8Dw0kFaqtNwhGLilo_1nyEYL-jaZRlBP8RpJKG-lvND2P2vQKs4FO16uFkkxxj_uXKxRZZBOCHz-KPJs7wRMtDJC582gZEXhMuKRrCORkF5Ca0ShZ7zkZiI",
    selected: true,
  },
  {
    fileName: "Project_Mockup_v2.png",
    tags: ["Work", "Design"],
    date: "Oct 22, 2023",
    size: "1.1 MB",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCCiJHExt1eN5kc811x82xEe0FAUpjhOyjeUTviazHzFwhcFMp8sSh3zJUTifomKhI6b6Mnm31iQ6NY1A0FaQyx0UE4Yp3XWqOfIKpIgQBaKJmSBfP2fhQ_OoalzG1uSpFUShutOxzkrrNyY2poWqyBL4S3XXFIbwxnSDSWolHGNrA9jB2y-3b04DPpaU3FtiDLv9K_T6YXuw5OZQ_24JYJcOGkf9624uCfQQR3xB-ZpIcdkGFdJZPFxx4Rmd12qYNsWfPsA1Eotbk",
  },
  {
    fileName: "Profile_Pic.jpg",
    tags: ["Personal"],
    date: "Sept 15, 2023",
    size: "450 KB",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDzFg0O-k_UtUprCSkbKtYlycukEQcr7PBCTfBGwrFgZxVU95LCQvVGBRJTGGsMDMPahyJJJwOwtQ8AORw9oaGMVuwDBC3OygeREC2arwMu4MFNoTHqU91-oQZpZbWKS9auR9OEM9Wq6qGSVaMRJX4AGCs1qD0T0twlhZoOgSwvWlylQAa__Oq3GfzBvWCTwsM0KOtjI6vzXGyzKfeKKGzhSozdTZF3i2Fw-18RQSc3mg1OyThrCQs1zcqmDl3SUnGaSpUQrzedza0",
  },
  {
    fileName: "Mountain_Hike.jpg",
    tags: ["Nature", "Travel"],
    date: "Aug 30, 2023",
    size: "12 MB",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC23b3BknDuRYrlrXZBknbBdDQjxO6lcSL2nHQOUPRVfjhDWma9ue_KmI_Bdb8YXKIT2kcylJzu9aqMt_UA1odRoXMlM-DQvHMN8xviGmfYJcu5ET44Exa8HmUwhss5n2fDQGw50jOV43toMRgSAFicsOh5qi6hnyRlB9bWefQNoNXnMUQ3hamj7Xg_yT1rFcXO3xroPVniPFC5-3CLQFuZouSYrFEWeXqUTgaZ4wT1OZBHcYnKfjTgWEm7M0ZH989bzG-Uu2qezBs",
  },
  {
    fileName: "Garden_Flora_05.jpg",
    tags: ["Nature"],
    date: "Aug 12, 2023",
    size: "3.2 MB",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDGz_2Hs1zCj2eLOn9ruUf8C_Nefte96jceJk-QtMj9w2y1VRoxLBnPP2EMdr_75quOp72upICe_5o_hRh2Vvi8nhFlBSADk5EfPhXl821O6tUY-bzcXFupqOc0Y2dhCAJaqeNuaahwe47D2MPZNzQfkeute21HB7gSNEvaV8dV2wk4nL8Bp3mZdeEqYzckqJLZUoLf2sxAYyO6T57UY7xAZk9Mqqmtyol0EhXFXzBgykU_Fu_bsHGFcGbMQl4rBIq40fNfjovSAC8",
  },
];

export default function GalleryList() {
  return (
    <div className="flex flex-col h-full w-full max-w-[1600px] mx-auto">
      {/* Title */}
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-6">
        My Gallery
      </h1>

      {/* Toolbar & Filters */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-3 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-sm z-20 rounded-t-xl">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mask-gradient">
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
            <span className="material-symbols-outlined text-[18px]">
              calendar_month
            </span>
            <span>Date: All time</span>
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
            <span className="material-symbols-outlined text-[18px]">image</span>
            <span>Type: All</span>
          </button>
        </div>

        {/* View Toggle */}
        <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
          <Link
            href="/gallery/grid"
            className="p-1.5 rounded text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-600 hover:shadow-sm transition-all"
            title="Grid View"
          >
            <span className="material-symbols-outlined text-[20px]">
              grid_view
            </span>
          </Link>
          <button
            className="p-1.5 rounded bg-white dark:bg-slate-600 text-primary shadow-sm"
            title="List View"
          >
            <span className="material-symbols-outlined text-[20px]">
              view_list
            </span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden rounded-b-xl">
        <div className="overflow-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="p-4 w-14 align-middle" scope="col">
                  <div className="flex items-center justify-center">
                    <input
                      className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary bg-white dark:bg-slate-800 dark:border-slate-600 cursor-pointer"
                      type="checkbox"
                    />
                  </div>
                </th>
                <th
                  className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-16"
                  scope="col"
                >
                  Preview
                </th>
                <th
                  className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 group"
                  scope="col"
                >
                  File Name
                </th>
                <th
                  className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-40 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 hidden md:table-cell group"
                  scope="col"
                >
                  Date Uploaded
                </th>
                <th
                  className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-32 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 hidden sm:table-cell group"
                  scope="col"
                >
                  Size
                </th>
                <th
                  className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-64 hidden lg:table-cell"
                  scope="col"
                >
                  Tags
                </th>
                <th
                  className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-20 text-center"
                  scope="col"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {rows.map((row, idx) => (
                <tr
                  key={idx}
                  className={`group hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${row.selected
                      ? "bg-blue-50/50 dark:bg-primary/5"
                      : ""
                    }`}
                >
                  <td className="p-4 align-middle">
                    <div className="flex items-center justify-center">
                      <input
                        defaultChecked={row.selected}
                        className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary bg-white dark:bg-slate-800 dark:border-slate-600 cursor-pointer"
                        type="checkbox"
                      />
                    </div>
                  </td>
                  <td className="py-3 px-4 align-middle">
                    <div className="h-10 w-10 rounded-lg bg-slate-200 overflow-hidden ring-1 ring-slate-900/5 dark:ring-white/10">
                      <img
                        className="h-full w-full object-cover"
                        alt={row.fileName}
                        src={row.imageUrl}
                      />
                    </div>
                  </td>
                  <td className="py-3 px-4 align-middle">
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm text-slate-900 dark:text-white">
                        {row.fileName}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 lg:hidden">
                        {row.tags.join(", ")}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 align-middle hidden md:table-cell">
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {row.date}
                    </span>
                  </td>
                  <td className="py-3 px-4 align-middle hidden sm:table-cell">
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {row.size}
                    </span>
                  </td>
                  <td className="py-3 px-4 align-middle hidden lg:table-cell">
                    <div className="flex flex-wrap gap-2">
                      {row.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 align-middle text-center">
                    <button className="text-slate-400 hover:text-primary p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
                      <span className="material-symbols-outlined">
                        more_vert
                      </span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
