"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";

type Option = { id: string; name: string };

/**
 * Combobox simples para selecionar um paciente entre muitos.
 * - Digite parte do nome para filtrar.
 * - Clique em um resultado para selecionar.
 * - O <input type="hidden" name={name}> guarda o ID que vai no POST.
 *
 * Não usa libs externas para manter o bundle pequeno e funcionar offline.
 */
export function PatientCombobox({
  patients,
  defaultPatientId,
  name = "patientId",
  required = false,
  placeholder = "Buscar paciente pelo nome...",
  id = "patient-combobox",
}: {
  patients: Option[];
  defaultPatientId?: string;
  name?: string;
  required?: boolean;
  placeholder?: string;
  id?: string;
}) {
  const initial = patients.find((p) => p.id === defaultPatientId) ?? null;
  const [selected, setSelected] = useState<Option | null>(initial);
  const [query, setQuery] = useState(initial?.name ?? "");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients.slice(0, 50);
    return patients
      .filter((p) => p.name.toLowerCase().includes(q))
      .slice(0, 50);
  }, [query, patients]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    setHighlight(0);
  }, [query, open]);

  function pick(opt: Option) {
    setSelected(opt);
    setQuery(opt.name);
    setOpen(false);
  }

  function clear() {
    setSelected(null);
    setQuery("");
    setOpen(true);
  }

  const showList = open && filtered.length > 0;
  const showEmpty = open && filtered.length === 0 && query.trim().length > 0;

  return (
    <div className="relative" ref={wrapRef}>
      <input
        type="hidden"
        name={name}
        value={selected?.id ?? ""}
        // O `required` no hidden não dispara :invalid no Chrome para hidden,
        // então também marcamos o input visível como required quando preciso.
        required={required && !selected}
      />
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          id={id}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(null);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setHighlight((h) => Math.min(h + 1, filtered.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlight((h) => Math.max(h - 1, 0));
            } else if (e.key === "Enter") {
              if (open && filtered[highlight]) {
                e.preventDefault();
                pick(filtered[highlight]);
              }
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder={placeholder}
          className="h-12 w-full rounded-lg border-2 border-input bg-background pl-10 pr-10 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={`${id}-listbox`}
          autoComplete="off"
          required={required && !selected}
        />
        {(query || selected) && (
          <button
            type="button"
            onClick={clear}
            aria-label="Limpar paciente"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {showList && (
        <ul
          id={`${id}-listbox`}
          role="listbox"
          className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-lg border-2 border-input bg-popover shadow-xl"
        >
          {filtered.map((p, i) => {
            const active = i === highlight;
            return (
              <li key={p.id} role="option" aria-selected={selected?.id === p.id}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pick(p);
                  }}
                  onMouseEnter={() => setHighlight(i)}
                  className={`w-full text-left px-4 py-3 text-base ${
                    active ? "bg-accent" : "hover:bg-accent/60"
                  } ${selected?.id === p.id ? "font-semibold" : ""}`}
                >
                  {p.name}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {showEmpty && (
        <div className="absolute z-30 mt-1 w-full rounded-lg border-2 border-input bg-popover px-4 py-3 text-sm text-muted-foreground shadow-xl">
          Nenhum paciente encontrado.
        </div>
      )}
    </div>
  );
}
