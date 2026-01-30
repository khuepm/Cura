import React from "react";

export default function Header() {
  return (
    <header className="shrink-0 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151f2b] px-6 py-3 z-20">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 text-slate-900 dark:text-white">
          <div className="size-8 text-primary flex items-center justify-center">
            <svg
              className="w-full h-full"
              fill="currentColor"
              viewBox="0 0 48 48"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M24 4C25.7818 14.2173 33.7827 22.2182 44 24C33.7827 25.7818 25.7818 33.7827 24 44C22.2182 33.7827 14.2173 25.7818 4 24C14.2173 22.2182 22.2182 14.2173 24 4Z"></path>
            </svg>
          </div>
          <h2 className="text-xl font-bold leading-tight tracking-tight">
            Image Manager
          </h2>
        </div>
        {/* Search Bar */}
        <label className="hidden md:flex flex-col w-96 h-10 ml-8">
          <div className="flex w-full h-full items-stretch rounded-lg bg-background-light dark:bg-slate-800 focus-within:ring-2 focus-within:ring-primary/50 transition-all">
            <div className="text-slate-500 dark:text-slate-400 flex items-center justify-center pl-3">
              <span className="material-symbols-outlined text-[20px]">
                search
              </span>
            </div>
            <input
              className="flex w-full bg-transparent border-none focus:ring-0 text-sm px-3 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 font-normal outline-none"
              placeholder="Search photos, albums, or tags"
              defaultValue=""
            />
          </div>
        </label>
      </div>
      <div className="flex items-center gap-4">
        <button className="flex items-center justify-center size-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
          <span className="material-symbols-outlined">settings</span>
        </button>
        <button className="flex items-center justify-center size-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
          <span className="material-symbols-outlined">help</span>
        </button>
        <div
          className="bg-center bg-no-repeat bg-cover rounded-full size-9 ring-2 ring-slate-100 dark:ring-slate-700 cursor-pointer"
          data-alt="User profile picture placeholder"
          style={{
            backgroundImage:
              'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBAtHqI0MI2XSg-F_kH9imj9Pis3T01ryEW4DDXAmD8j_bdar_SJMO8Il128L_aZSF2_njAMTy6spaHTMwhb0PTR_-CvMyZDL3zbb08UIZNty1UUnDVz_pNcI877X0A2yhh0-Cq8j-plMzpdx7LIRH5jBEOw469u2CIpRXoCVOKQeDtI8TJu5iIAF2WewWKsmqSK27q27uEmp0ID1WD466uxtOYh73N9x8FJXPxIO43DY9LEj1T-3hnXBUPKv3VbgPPi9CKAtg9C_Q")',
          }}
        ></div>
      </div>
    </header>
  );
}
