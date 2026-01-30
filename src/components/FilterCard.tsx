import React from "react";

interface FilterCardProps {
  title: string;
  count: number;
  description: string;
  imageUrl: string;
  icon: string;
  iconColor?: string;
}

export default function FilterCard({
  title,
  count,
  description,
  imageUrl,
  icon,
  iconColor = "text-primary",
}: FilterCardProps) {
  return (
    <div className="group relative flex flex-col bg-white dark:bg-[#151f2b] rounded-xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-slate-100 dark:border-slate-800/50">
      <div
        className="h-40 bg-cover bg-center relative"
        style={{ backgroundImage: `url("${imageUrl}")` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
        <div className="absolute top-3 right-3 bg-white/90 dark:bg-black/70 backdrop-blur-sm rounded-full p-1.5 shadow-sm">
          <span className={`material-symbols-outlined ${iconColor} text-[18px] block`}>
            {icon}
          </span>
        </div>
      </div>
      <div className="p-4 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
            {title}
          </h3>
          <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold px-2 py-0.5 rounded-full">
            {count}
          </span>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
          {description}
        </p>
      </div>
    </div>
  );
}
