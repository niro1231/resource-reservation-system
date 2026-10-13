import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  CalendarClock,
  CalendarPlus,
  CheckCircle2,
  CircleX,
  Clock3,
  LayoutDashboard,
  MapPin,
  Plus,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const now = new Date();

  const [
    totalResources,
    activeResources,
    upcomingCount,
    cancelledCount,
    upcomingReservations,
  ] = await Promise.all([
    prisma.resource.count(),

    prisma.resource.count({
      where: { isActive: true },
    }),

    prisma.reservation.count({
      where: {
        status: "CONFIRMED",
        startTime: { gte: now },
      },
    }),

    prisma.reservation.count({
      where: { status: "CANCELLED" },
    }),

    prisma.reservation.findMany({
      where: {
        status: "CONFIRMED",
        startTime: { gte: now },
      },
      include: {
        resource: {
          select: {
            name: true,
            location: true,
          },
        },
      },
      orderBy: { startTime: "asc" },
      take: 5,
    }),
  ]);

  const stats = [
    {
      label: "Total resources",
      value: totalResources,
      description: "All registered resources",
      icon: LayoutDashboard,
      color: "text-blue-700",
      bg: "bg-blue-50",
    },
    {
      label: "Active resources",
      value: activeResources,
      description: "Available for new bookings",
      icon: CheckCircle2,
      color: "text-emerald-700",
      bg: "bg-emerald-50",
    },
    {
      label: "Upcoming reservations",
      value: upcomingCount,
      description: "Confirmed future bookings",
      icon: CalendarClock,
      color: "text-violet-700",
      bg: "bg-violet-50",
    },
    {
      label: "Cancelled reservations",
      value: cancelledCount,
      description: "Bookings cancelled",
      icon: CircleX,
      color: "text-rose-700",
      bg: "bg-rose-50",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-700 text-white">
              <CalendarCheck size={24} />
            </div>

            <div>
              <h1 className="font-bold tracking-tight">
                ResourceFlow
              </h1>
              <p className="text-xs text-slate-500">
                Resource Reservation Management
              </p>
            </div>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/resources"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              Resources
            </Link>

            <Link
              href="/reservations"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 sm:px-4"
            >
              <Plus size={17} />
              <span className="hidden sm:inline">New reservation</span>
              <span className="sm:hidden">Book</span>
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome */}
        <section className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-sm font-semibold text-blue-700">
              PRIMEWAVE LAB ASSESSMENT
            </p>

            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Dashboard
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Manage shared resources, keep track of reservations,
              and coordinate bookings in one place.
            </p>
          </div>

          <Link
            href="/resources"
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:bg-slate-100"
          >
            Manage resources
            <ArrowRight size={16} />
          </Link>
        </section>

        {/* Statistics */}
        <section
          aria-label="Resource and reservation statistics"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <article
                key={stat.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {stat.label}
                    </p>

                    <p className="mt-3 text-3xl font-bold tracking-tight">
                      {stat.value}
                    </p>
                  </div>

                  <div
                    className={`rounded-xl p-3 ${stat.bg} ${stat.color}`}
                  >
                    <Icon size={22} />
                  </div>
                </div>

                <p className="mt-4 text-xs text-slate-500">
                  {stat.description}
                </p>
              </article>
            );
          })}
        </section>

        {/* Quick actions */}
        <section className="mt-8">
          <div className="mb-4">
            <h3 className="text-lg font-bold">Quick actions</h3>
            <p className="mt-1 text-sm text-slate-500">
              Get started with your resource management tasks.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Link
              href="/resources"
              className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Users size={23} />
              </div>

              <div className="min-w-0 flex-1">
                <h4 className="font-semibold">Manage resources</h4>
                <p className="mt-1 text-sm leading-5 text-slate-500">
                  Add, edit, activate, or deactivate shared resources.
                </p>
              </div>

              <ArrowRight
                size={19}
                className="shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-700"
              />
            </Link>

            <Link
              href="/reservations"
              className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                <CalendarPlus size={23} />
              </div>

              <div className="min-w-0 flex-1">
                <h4 className="font-semibold">Manage reservations</h4>
                <p className="mt-1 text-sm leading-5 text-slate-500">
                  Create bookings, review schedules, and cancel reservations.
                </p>
              </div>

              <ArrowRight
                size={19}
                className="shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-700"
              />
            </Link>
          </div>
        </section>

        {/* Upcoming reservations */}
        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
            <div>
              <h3 className="text-lg font-bold">
                Upcoming reservations
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                The next confirmed bookings for your resources.
              </p>
            </div>

            <Link
              href="/reservations"
              className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900"
            >
              View all reservations
              <ArrowRight size={16} />
            </Link>
          </div>

          {upcomingReservations.length === 0 ? (
            <div className="flex flex-col items-center px-5 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <CalendarClock size={26} />
              </div>

              <h4 className="mt-4 font-semibold">
                No upcoming reservations
              </h4>

              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                Your next confirmed bookings will appear here when
                reservations are scheduled.
              </p>

              <Link
                href="/reservations"
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
              >
                <Plus size={17} />
                Create reservation
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {upcomingReservations.map((reservation) => (
                <article
                  key={reservation.id}
                  className="flex flex-col gap-3 px-5 py-5 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:px-6"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <CalendarCheck size={21} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="truncate font-semibold">
                      {reservation.resource.name}
                    </h4>

                    <p className="mt-1 text-sm text-slate-500">
                      {reservation.reservedBy} · {reservation.purpose}
                    </p>

                    {reservation.resource.location && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                        <MapPin size={13} />
                        {reservation.resource.location}
                      </p>
                    )}
                  </div>

                  <div className="sm:min-w-52 sm:text-right">
                    <p className="flex items-center gap-1.5 text-sm font-medium text-slate-700 sm:justify-end">
                      <Clock3 size={15} className="text-slate-400" />
                      {reservation.startTime.toLocaleString("en-LK", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "Asia/Colombo",
                      })}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Until{" "}
                      {reservation.endTime.toLocaleString("en-LK", {
                        timeStyle: "short",
                        timeZone: "Asia/Colombo",
                      })}
                    </p>
                  </div>

                  <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Confirmed
                  </span>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="mt-8 border-t border-slate-200 py-5 text-center text-xs text-slate-500">
          ResourceFlow · Resource Reservation Management System
        </footer>
      </div>
    </main>
  );
}