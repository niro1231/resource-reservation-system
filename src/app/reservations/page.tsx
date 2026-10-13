
"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import {
  CalendarPlus,
  RefreshCw,
  XCircle,
} from "lucide-react";

type Resource = {
  id: number;
  name: string;
  type: string;
  location: string | null;
  isActive: boolean;
};

type Reservation = {
  id: number;
  resourceId: number;
  reservedBy: string;
  purpose: string;
  startTime: string;
  endTime: string;
  status: "CONFIRMED" | "CANCELLED";
  createdAt: string;
  resource: Resource;
};

type ReservationForm = {
  resourceId: string;
  reservedBy: string;
  purpose: string;
  startTime: string;
  endTime: string;
};

const initialForm: ReservationForm = {
  resourceId: "",
  reservedBy: "",
  purpose: "",
  startTime: "",
  endTime: "",
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ReservationsPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [form, setForm] = useState<ReservationForm>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [resourceResponse, reservationResponse] =
        await Promise.all([
          fetch("/api/resources", { cache: "no-store" }),
          fetch("/api/reservations", { cache: "no-store" }),
        ]);

      const resourceData = await resourceResponse.json();
      const reservationData = await reservationResponse.json();

      if (!resourceResponse.ok) {
        throw new Error(
          resourceData.error || "Unable to load resources."
        );
      }

      if (!reservationResponse.ok) {
        throw new Error(
          reservationData.error || "Unable to load reservations."
        );
      }

      setResources(resourceData);
      setReservations(reservationData);

      // Choose the first active resource if none is selected.
      setForm((current) => {
        if (
          current.resourceId &&
          resourceData.some(
            (resource: Resource) =>
              resource.id === Number(current.resourceId) &&
              resource.isActive
          )
        ) {
          return current;
        }

        const firstActive = resourceData.find(
          (resource: Resource) => resource.isActive
        );

        return {
          ...current,
          resourceId: firstActive ? String(firstActive.id) : "",
        };
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load reservation data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const start = new Date(form.startTime);
    const end = new Date(form.endTime);

    if (
      !form.startTime ||
      !form.endTime ||
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      setError("Please select a valid start and end time.");
      setSaving(false);
      return;
    }

    if (end <= start) {
      setError("End time must be later than start time.");
      setSaving(false);
      return;
    }

    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resourceId: Number(form.resourceId),
          reservedBy: form.reservedBy,
          purpose: form.purpose,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const detailMessages = data.details
          ? Object.values(data.details)
              .flat()
              .filter(Boolean)
              .join(" ")
          : "";

        throw new Error(
          detailMessages || data.error || "Unable to create reservation."
        );
      }

      setSuccess("Reservation created successfully.");

      setForm((current) => ({
        ...initialForm,
        resourceId: current.resourceId,
      }));

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create reservation."
      );
    } finally {
      setSaving(false);
    }
  }

  async function cancelReservation(reservation: Reservation) {
    const confirmed = window.confirm(
      `Cancel the reservation for "${reservation.resource.name}"?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/reservations/${reservation.id}`,
        { method: "PATCH" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to cancel reservation.");
      }

      setSuccess("Reservation cancelled successfully.");
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to cancel reservation."
      );
    }
  }

  const confirmedCount = reservations.filter(
    (item) => item.status === "CONFIRMED"
  ).length;

  const cancelledCount = reservations.filter(
    (item) => item.status === "CANCELLED"
  ).length;

  const filteredReservations = reservations.filter((item) => {
    if (statusFilter === "ALL") return true;
    return item.status === statusFilter;
  });

  const activeResources = resources.filter((item) => item.isActive);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
              Resource Reservation System
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Reservation Management
            </h1>
            <p className="mt-2 text-slate-600">
              Schedule resource usage and prevent booking conflicts.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/resources"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium hover:bg-slate-100"
            >
              Manage resources
            </Link>

            <button
              type="button"
              onClick={() => void loadData()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium hover:bg-slate-100 disabled:opacity-50"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
          >
            {success}
          </div>
        )}

        <section className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total reservations</p>
            <p className="mt-2 text-3xl font-bold">
              {reservations.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Confirmed</p>
            <p className="mt-2 text-3xl font-bold text-green-700">
              {confirmedCount}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Cancelled</p>
            <p className="mt-2 text-3xl font-bold text-slate-500">
              {cancelledCount}
            </p>
          </div>
        </section>

        <section className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">Create a reservation</h2>
            <p className="mt-1 text-sm text-slate-500">
              Only active resources can be reserved. Times are interpreted
              in your browser's local time zone.
            </p>
          </div>

          {activeResources.length === 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              There are no active resources available.{" "}
              <Link
                href="/resources"
                className="font-semibold underline"
              >
                Activate or create a resource
              </Link>{" "}
              before making a reservation.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="resourceId"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    Resource *
                  </label>
                  <select
                    id="resourceId"
                    required
                    value={form.resourceId}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        resourceId: event.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Select a resource</option>
                    {activeResources.map((resource) => (
                      <option key={resource.id} value={resource.id}>
                        {resource.name} — {resource.type}
                        {resource.location
                          ? ` (${resource.location})`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="reservedBy"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    Reserved by *
                  </label>
                  <input
                    id="reservedBy"
                    required
                    minLength={2}
                    maxLength={100}
                    value={form.reservedBy}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        reservedBy: event.target.value,
                      })
                    }
                    placeholder="Enter the person's name"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="startTime"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    Start date and time *
                  </label>
                  <input
                    id="startTime"
                    type="datetime-local"
                    required
                    value={form.startTime}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        startTime: event.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="endTime"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    End date and time *
                  </label>
                  <input
                    id="endTime"
                    type="datetime-local"
                    required
                    value={form.endTime}
                    min={form.startTime || undefined}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        endTime: event.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="md:col-span-2">
                  <label
                    htmlFor="purpose"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    Reservation purpose *
                  </label>
                  <textarea
                    id="purpose"
                    required
                    minLength={3}
                    maxLength={500}
                    rows={3}
                    value={form.purpose}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        purpose: event.target.value,
                      })
                    }
                    placeholder="e.g. Weekly project planning meeting"
                    className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving || loading || !form.resourceId}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CalendarPlus size={18} />
                {saving ? "Creating reservation..." : "Create reservation"}
              </button>
            </form>
          )}
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-xl font-semibold">All reservations</h2>
              <p className="mt-1 text-sm text-slate-500">
                Cancelled reservations remain visible for record keeping.
              </p>
            </div>

            <div>
              <label htmlFor="statusFilter" className="sr-only">
                Filter by status
              </label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="ALL">All statuses</option>
                <option value="CONFIRMED">Confirmed only</option>
                <option value="CANCELLED">Cancelled only</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500">
              Loading reservations...
            </div>
          ) : filteredReservations.length === 0 ? (
            <div className="p-8 text-center">
              <p className="font-medium">No reservations found.</p>
              <p className="mt-1 text-sm text-slate-500">
                Create a reservation using the form above.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Resource</th>
                    <th className="px-5 py-3 font-semibold">Reserved by</th>
                    <th className="px-5 py-3 font-semibold">Purpose</th>
                    <th className="px-5 py-3 font-semibold">Start</th>
                    <th className="px-5 py-3 font-semibold">End</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredReservations.map((reservation) => (
                    <tr key={reservation.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <p className="font-semibold">
                          {reservation.resource.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {reservation.resource.type}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        {reservation.reservedBy}
                      </td>

                      <td className="max-w-xs whitespace-normal px-5 py-4">
                        {reservation.purpose}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        {formatDateTime(reservation.startTime)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        {formatDateTime(reservation.endTime)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            reservation.status === "CONFIRMED"
                              ? "bg-green-100 text-green-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {reservation.status === "CONFIRMED"
                            ? "Confirmed"
                            : "Cancelled"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        {reservation.status === "CONFIRMED" ? (
                          <button
                            type="button"
                            onClick={() =>
                              void cancelReservation(reservation)
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 font-medium text-red-700 hover:bg-red-50"
                          >
                            <XCircle size={15} />
                            Cancel
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">
                            No action
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="mt-6 text-center text-xs text-slate-500">
          Resource Reservation Management System · Reservation Administration
        </p>
      </div>
    </main>
  );
}
