import React, { useMemo, useState } from "react";
import api from "../../services/api.js";
import toast from "react-hot-toast";

// odmah pročitaj user-a iz localStorage
const user = JSON.parse(localStorage.getItem("user") || "{}");
const userId = user?.id;

const TIP_RESURSA = [
  "Osoblje",
  "Oprema",
  "Hrana",
  "Tehnika",
  "Scena",
  "Drugo",
];

const initialForm = {
  Naziv: "",
  Opis: "",
  Tip: "",
  UkupnoKolicina: "",
};

export default function NewResource() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    const hasNaziv = (form.Naziv ?? "").trim() !== "";
    const hasTip = (form.Tip ?? "").trim() !== "";
    const kStr = String(form.UkupnoKolicina ?? "").trim();
    const kNum = Number(kStr);
    const validK = kStr !== "" && Number.isInteger(kNum) && kNum > 0;
    return hasNaziv && hasTip && validK;
  }, [form]);

  function handleChange(e) {
    const { name, value } = e.target;

    if (name === "UkupnoKolicina") {
      if (value === "" || /^[0-9]+$/.test(value)) {
        setForm((f) => ({ ...f, [name]: value }));
      }
      return;
    }

    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const tipIndex = TIP_RESURSA.indexOf(form.Tip);
      if (tipIndex === -1) throw new Error("Nevažeći tip resursa.");

      if (!userId) throw new Error("Nema ID-ja prijavljenog dobavljača.");

      const payload = {
        Naziv: (form.Naziv ?? "").trim(),
        Opis: (form.Opis ?? "").trim(),
        Tip: form.Tip,
        UkupnoKolicina: Number(form.UkupnoKolicina),
        Dobavljac: userId,
      };

      console.log("Šaljem payload:", payload);

      await api.post("resursi/kreiraj", payload);
      toast.success("Resurs uspešno kreiran.");
      setForm(initialForm);
    } catch (err) {
      const msg =
        err?.response?.data?.title ||
        err?.response?.data?.message ||
        (typeof err?.response?.data === "string" ? err.response.data : null) ||
        err?.message ||
        "Greška pri kreiranju resursa.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold">Novi resurs</h1>

      <form
        onSubmit={handleSubmit}
        className="mt-6 grid grid-cols-1 gap-5 bg-white/5 p-6 rounded-2xl shadow"
      >
        {/* Naziv */}
        <div>
          <label className="block text-sm font-medium mb-1">Naziv *</label>
          <input
            type="text"
            name="Naziv"
            value={form.Naziv}
            onChange={handleChange}
            className="w-full rounded-xl border px-3 py-2 bg-transparent focus:outline-none focus:ring"
            placeholder="npr. LED reflektor 300W"
          />
        </div>

        {/* Opis */}
        <div>
          <label className="block text-sm font-medium mb-1">Opis</label>
          <textarea
            name="Opis"
            value={form.Opis}
            onChange={handleChange}
            className="w-full rounded-xl border px-3 py-2 bg-transparent focus:outline-none focus:ring"
            placeholder="Kratak opis (opciono)"
            rows={3}
          />
        </div>

        {/* Tip */}
        <div>
          <label className="block text-sm font-medium mb-1">Tip *</label>
          <select
            name="Tip"
            value={form.Tip}
            onChange={handleChange}
            className="w-full rounded-xl border px-3 py-2 bg-neutral-800 text-white focus:outline-none focus:ring"
          >
            <option value="" disabled>
              -- odaberi tip --
            </option>
            {TIP_RESURSA.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Ukupno količina */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Ukupno količina *
          </label>
          <input
            type="text"
            inputMode="numeric"
            name="UkupnoKolicina"
            value={form.UkupnoKolicina}
            onChange={handleChange}
            className="w-full rounded-xl border px-3 py-2 bg-transparent focus:outline-none focus:ring"
            placeholder="npr. 10"
          />
        </div>

        {/* Dugmad */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="rounded-xl px-5 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Čuvam..." : "Sačuvaj resurs"}
          </button>
        </div>
      </form>
    </div>
  );
}
