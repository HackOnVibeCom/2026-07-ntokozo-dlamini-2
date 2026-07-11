"use client";
import React from "react";
import AppSidebar from "./app-sidebar";
import Header from "./header";

export default function DashboardShell({ children, headerRight }: { children: React.ReactNode; headerRight?: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <AppSidebar />
      <div className="ml-60 flex flex-col min-h-screen">
        <Header>{headerRight}</Header>
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}