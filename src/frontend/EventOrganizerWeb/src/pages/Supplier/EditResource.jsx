import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import toast from "react-hot-toast";

const TIP_RESURSA = ["Osoblje","Oprema","Hrana","Tehnika","Scena","Drugo"];

// helperi
const S = (v) => (v == null ? "" : String(v));

export default function EditResource(){
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    Naziv: "",
    Opis: "",
    Tip: "",
    UkupnoKolicina: "" // prikazujemo ukupno, ali pri slanju šaljemo Kolicina (DTO zahteva Kolicina)
  });

  useEffect(()=>{
    let alive = true;
    (async ()=>{
      if (!id) {
        toast.error("ID resursa nije prosleđen.");
        navigate("/resources");
        return;
      }
      try{
        // Backend: /api/resursi/vrati-po-id/{id}
        const res = await api.get(`/resursi/vrati-po-id/${id}`);
        if(!alive) return;
        const d = res?.data || {};

        const naziv = d.Naziv ?? d.naziv ?? "";
        const opis  = d.Opis ?? d.opis ?? "";
        const tipRaw = d.Tip ?? d.tip;
        const ukupno = d.UkupnoKolicina ?? d.ukupnoKolicina ?? d.Kolicina ?? d.kolicina ?? "";

        let tipName = "";
        if (typeof tipRaw === "number") tipName = TIP_RESURSA[tipRaw] ?? String(tipRaw);
        else if (!Number.isNaN(Number(tipRaw))) tipName = TIP_RESURSA[Number(tipRaw)] ?? String(tipRaw);
        else tipName = S(tipRaw);

        setForm({
          Naziv: S(naziv),
          Opis: S(opis),
          Tip: tipName,
          UkupnoKolicina: S(ukupno)
        });
      }catch(e){
        const code = e?.response?.status;
        if (code === 404) {
          toast.error("Resurs nije pronađen.");
          navigate("/resources");
          return;
        }
        toast.error("Greška pri učitavanju resursa.");
      }finally{
        if(alive) setLoading(false);
      }
    })();
    return ()=>{ alive = false; };
  }, [id, navigate]);

  const canSubmit = useMemo(()=>{
    const hasNaziv = (form.Naziv ?? "").trim() !== "";
    const hasTip = (form.Tip ?? "").trim() !== "";
    const kStr = String(form.UkupnoKolicina ?? "").trim();
    const kNum = Number(kStr);
    return hasNaziv && hasTip && kStr !== "" && Number.isInteger(kNum) && kNum > 0;
  }, [form]);

  function handleChange(e){
    const { name, value } = e.target;
    if (name === "UkupnoKolicina"){
      if (value === "" || /^[0-9]+$/.test(value)){
        setForm(f => ({...f, [name]: value}));
      }
      return;
    }
    setForm(f => ({...f, [name]: value}));
  }

  async function handleSave(e){
    e.preventDefault();
    if (!canSubmit) return;

    try{
      setSaving(true);
      const tipIndex = TIP_RESURSA.indexOf(form.Tip);
      if (tipIndex === -1) throw new Error("Nevažeći tip resursa.");

      // AzurirajResursDto očekuje: Naziv, Opis, Tip (enum), Kolicina (ne 'UkupnoKolicina'), Lokacija?, Aktivnost?
      const payload = {
        Naziv: (form.Naziv ?? "").trim(),
        Opis: (form.Opis ?? "").trim(),
        Tip: tipIndex,
        Kolicina: Number(form.UkupnoKolicina)
      };

      await api.put(`/resursi/azuriraj/${id}`, payload);
      toast.success("Resurs ažuriran.");
      navigate("/resources");
    }catch(err){
      const msg =
        err?.response?.data?.title ||
        err?.response?.data?.message ||
        (typeof err?.response?.data === "string" ? err.response.data : null) ||
        err?.message || "Greška pri čuvanju.";
      toast.error(msg);
    }finally{
      setSaving(false);
    }
  }

  if (loading) return <div className="p-4">Učitavanje...</div>;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold">Izmeni resurs</h1>

      <form onSubmit={handleSave} className="mt-6 grid grid-cols-1 gap-5 bg-white/5 p-6 rounded-2xl shadow">

        <div>
          <label className="block text-sm font-medium mb-1">Naziv *</label>
          <input
            type="text"
            name="Naziv"
            value={form.Naziv}
            onChange={handleChange}
            className="w-full rounded-xl border px-3 py-2 bg-transparent focus:outline-none focus:ring"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Opis</label>
          <textarea
            name="Opis"
            value={form.Opis}
            onChange={handleChange}
            className="w-full rounded-xl border px-3 py-2 bg-transparent focus:outline-none focus:ring"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Tip *</label>
          <select
            name="Tip"
            value={form.Tip}
            onChange={handleChange}
            className="w-full rounded-xl border px-3 py-2 bg-neutral-800 text-white focus:outline-none focus:ring"
          >
            <option value="" disabled>-- odaberi tip --</option>
            {TIP_RESURSA.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Ukupno količina *</label>
          <input
            type="text"
            inputMode="numeric"
            name="UkupnoKolicina"
            value={form.UkupnoKolicina}
            onChange={handleChange}
            className="w-full rounded-xl border px-3 py-2 bg-transparent focus:outline-none focus:ring"
          />
        </div>

        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            className="rounded-xl px-4 py-2 border border-white/10 hover:bg-white/10"
            onClick={()=>navigate("/resources")}
          >
            Nazad
          </button>
          <button
            type="submit"
            disabled={!canSubmit || saving}
            className="rounded-xl px-5 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Čuvam..." : "Sačuvaj izmene"}
          </button>
        </div>
      </form>
    </div>
  );
}
