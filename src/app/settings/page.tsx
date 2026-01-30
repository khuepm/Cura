import React from "react";

export default function SettingsPage() {
  return (
    <div className="flex flex-1 justify-center py-2">
      <div className="flex w-full max-w-[1200px] gap-8 flex-col md:flex-row">
        {/* Side Navigation for Settings */}
        <aside className="w-full md:w-64 flex-shrink-0 flex flex-col gap-6">
          <div className="flex flex-col">
            <h1 className="text-slate-900 dark:text-white text-xl font-bold px-3">
              Settings
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm px-3">
              Configure your workspace
            </p>
          </div>
          <nav className="flex flex-col gap-1">
            <a
              className="bg-primary text-white flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors"
              href="#"
            >
              <span className="material-symbols-outlined">database</span>
              <span>Storage</span>
            </a>
            <a
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 font-medium text-sm transition-colors"
              href="#"
            >
              <span className="material-symbols-outlined">cloud_sync</span>
              <span>Cloud Integration</span>
            </a>
            <a
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 font-medium text-sm transition-colors"
              href="#"
            >
              <span className="material-symbols-outlined">notifications_active</span>
              <span>Notifications</span>
            </a>
            <a
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 font-medium text-sm transition-colors"
              href="#"
            >
              <span className="material-symbols-outlined">account_circle</span>
              <span>Account</span>
            </a>
            <div className="my-4 border-t border-slate-200 dark:border-slate-800"></div>
            <a
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 font-medium text-sm transition-colors"
              href="#"
            >
              <span className="material-symbols-outlined">security</span>
              <span>Privacy & Security</span>
            </a>
          </nav>
        </aside>

        {/* Configuration Panels */}
        <main className="flex-1 flex flex-col gap-8 w-full max-w-[800px]">
          {/* Storage Section */}
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Storage
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Configure your local and cloud storage paths for efficient asset
                management.
              </p>
            </div>
            <div className="p-6 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Local Storage Directory
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-stretch rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 overflow-hidden">
                    <div className="flex items-center justify-center pl-3 text-slate-400">
                      <span className="material-symbols-outlined">folder</span>
                    </div>
                    <input
                      className="w-full bg-transparent border-none focus:ring-0 text-sm text-slate-900 dark:text-white px-3"
                      readOnly
                      value="/Users/admin/Pictures/Management"
                    />
                  </div>
                  <button className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors">
                    Browse
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  This directory will be used for caching and offline image
                  processing.
                </p>
              </div>
            </div>
          </section>

          {/* Cloud Integration Section */}
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Cloud Integration
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Sync your library with external cloud providers.
                </p>
              </div>
              <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                Connected
              </span>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded flex items-center justify-center bg-white dark:bg-slate-700 shadow-sm">
                    <span className="material-symbols-outlined text-2xl text-primary">
                      add_to_drive
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      Google Drive
                    </p>
                    <p className="text-xs text-slate-500">
                      Last synced: 12 minutes ago
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input checked className="sr-only peer" type="checkbox" />
                    <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                  <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    <span className="material-symbols-outlined">settings</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Notifications Section */}
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Notifications
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Manage how you receive updates and alerts.
              </p>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    New Image Alerts
                  </p>
                  <p className="text-xs text-slate-500">
                    Notify when new images are added to watched folders.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input checked className="sr-only peer" type="checkbox" />
                  <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              <div className="border-t border-slate-50 dark:border-slate-800 pt-4 flex items-center justify-between">
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    Storage Full Warnings
                  </p>
                  <p className="text-xs text-slate-500">
                    Get alerts when local storage exceeds 90% capacity.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input checked className="sr-only peer" type="checkbox" />
                  <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              <div className="border-t border-slate-50 dark:border-slate-800 pt-4 flex items-center justify-between">
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    System Updates
                  </p>
                  <p className="text-xs text-slate-500">
                    Stay informed about new features and security patches.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input className="sr-only peer" type="checkbox" />
                  <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </section>

          {/* Account Section */}
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Account
              </h2>
            </div>
            <div className="p-6 flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-full border-2 border-primary/20 bg-cover bg-center"
                  style={{
                    backgroundImage:
                      'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDZX1hwFut3hjSXpG67Nzu6a8snbeBv-ugdpZePTWbfvMBzmy51g1G7kdxlq83t2-mCrmocgCKJXJ0bERWZJqBLLe-GMsOMbR7roGkXgg50DweuQTcIf-AyIPzb2dHytx6p-XqWUG2lVErlQlVrQtL9mPu_rpiBONiu_AlFZ2cJDPKJGkLDDHO7gDmenEsv_5v6m-v3mYUR2l5GyH8GCTP-WDX3pxa0ZBxrCnyMqRtnelQdaAgDssYYqEHckrP32n9JEj5v0qqKHds")',
                  }}
                ></div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    Alex Rivera
                  </h3>
                  <p className="text-sm text-slate-500">alex.rivera@example.com</p>
                  <div className="flex gap-4 mt-2">
                    <button className="text-xs font-bold text-primary hover:underline">
                      Edit Profile
                    </button>
                    <button className="text-xs font-bold text-primary hover:underline">
                      Change Password
                    </button>
                  </div>
                </div>
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                <button className="flex items-center justify-center gap-2 px-6 py-2 border-2 border-red-500/20 text-red-600 dark:text-red-400 font-bold rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors w-full sm:w-auto">
                  <span className="material-symbols-outlined text-xl">logout</span>
                  Sign Out
                </button>
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-3 mb-10">
            <button className="px-6 py-2.5 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
              Discard Changes
            </button>
            <button className="px-8 py-2.5 bg-primary text-white font-bold rounded-lg shadow-lg shadow-primary/30 hover:bg-primary/90 hover:shadow-primary/40 active:scale-95 transition-all outline-none">
              Save Changes
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
