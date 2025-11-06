// src/pages/Organizer/NewEvent/PriceList.jsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import '../../../styles/NewEvent/pricelist.css';

import * as locationsApi from '../../../services/locationsApi';
import * as priceListApi from '../../../services/priceListApi';

const EMPTY_ITEM = {
  Naziv: '',
  Opis: '',
  Cena: '',
  Kolicina: '',
  UrlSlika: '',
};

const PRICEABLE_TYPES = new Set(['BAR','HRANA','VIP','INFO','BINA','ULAZ']);

function makeLocalItem(raw){
  const localId = raw?.localId || `local-${Math.random().toString(36).slice(2)}`;
  const id = raw?.Id || raw?._id || raw?.id || null;
  return {
    localId,
    Id: id,
    Naziv: raw?.Naziv ?? raw?.naziv ?? '',
    Opis: raw?.Opis ?? raw?.opis ?? '',
    Cena: Number(raw?.Cena ?? raw?.cena ?? 0),
    Kolicina: Number(raw?.Kolicina ?? raw?.kolicina ?? 0),
    UrlSlika: raw?.UrlSlika ?? raw?.URLslike ?? raw?.urlSlika ?? raw?.urlslike ?? '',
    status: raw?.status || (id ? 'existing' : 'new'),
  };
}

export default function PriceList({ eventId }){
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [locations, setLocations] = useState([]);
  const [existingLists, setExistingLists] = useState([]);

  const [currentListId, setCurrentListId] = useState('');
  const [previousListId, setPreviousListId] = useState('');
  const [selectedListId, setSelectedListId] = useState('');

  const [mode, setMode] = useState('idle'); // idle | creating | view | editing

  const [name, setName] = useState('');
  const [locationId, setLocationId] = useState('');
  const [items, setItems] = useState([]);
  const [removedIds, setRemovedIds] = useState([]);

  const [itemForm, setItemForm] = useState({ ...EMPTY_ITEM });
  const [editingItemLocalId, setEditingItemLocalId] = useState(null);

  const defaultLocationId = useMemo(() => {
    if (!Array.isArray(locations) || locations.length === 0) return '';
    const first = locations[0];
    return String(locationsApi.normalizeId(first) || '');
  }, [locations]);

  const isEditable = mode === 'creating' || mode === 'editing';
  const hasEvent = Boolean(eventId);

  const filterPriceableLocations = useCallback((list) => {
    const arr = Array.isArray(list) ? list : [];
    if (arr.length === 0) return [];
    const filtered = arr.filter((loc) => {
      const rawType = String(loc?.TipLokacije || loc?.tipLokacije || '').toUpperCase();
      return PRICEABLE_TYPES.has(rawType);
    });
    return filtered.length > 0 ? filtered : arr;
  }, []);

  const resetForm = useCallback(() => {
    setName('');
    setLocationId('');
    setItems([]);
    setRemovedIds([]);
    setItemForm({ ...EMPTY_ITEM });
    setEditingItemLocalId(null);
  }, []);

  const applyPriceListData = useCallback((result, signal) => {
    if (!result || signal?.aborted) return;
    const priceList = result.priceList || {};
    const id = priceList?.Id || priceList?._id || priceList?.id || '';
    if (signal?.aborted) return;
    setCurrentListId(id || '');
    setSelectedListId(id || '');
    setPreviousListId('');
    setName(priceList?.Naziv || priceList?.naziv || '');
    setLocationId(priceList?.LokacijaId || priceList?.lokacijaId || '');
    setItems((result.items || []).map((item) => makeLocalItem({ ...item, status: 'existing' })));
    setRemovedIds([]);
    setItemForm({ ...EMPTY_ITEM });
    setEditingItemLocalId(null);
    setMode(id ? 'view' : 'idle');
  }, []);

  const fetchPriceListData = useCallback(async (listId, signal) => {
    if (!listId || signal?.aborted) return null;
    const priceList = await priceListApi.getById(listId).catch(() => null);
    if (!priceList || signal?.aborted) return null;
    const rawIds = priceList?.Stavke || priceList?.stavke || [];
    const ids = Array.isArray(rawIds) ? rawIds : [];
    const items = [];
    for (const itemId of ids){
      if (signal?.aborted) return null;
      try {
        const item = await priceListApi.getItem(itemId);
        if (signal?.aborted) return null;
        if (item) items.push(item);
      } catch {}
    }
    return { priceList: { ...priceList, Id: priceList?.Id || priceList?.id || priceList?._id || listId }, items };
  }, []);

  const fetchListsAndApply = useCallback(async ({ preferredId = '', signal } = {}) => {
    if (!eventId || signal?.aborted) return;
    const shouldStop = () => Boolean(signal?.aborted);
    if (shouldStop()) return;
    setLoading(true);
    try {
      const [locsRaw, lists] = await Promise.all([
        locationsApi.listByEvent(eventId).catch(() => []),
        priceListApi.listAll().catch(() => []),
      ]);
      if (shouldStop()) return;

      const locs = filterPriceableLocations(locsRaw);
      setLocations(locs);

      const locationIds = new Set(
        (locs || [])
          .map((loc) => String(locationsApi.normalizeId(loc) || ''))
          .filter(Boolean)
      );

      const normalizedLists = (Array.isArray(lists) ? lists : [])
        .map((pl) => ({
          ...pl,
          Id: pl?.Id || pl?.id || pl?._id || '',
          LokacijaId: pl?.LokacijaId || pl?.lokacijaId || '',
          Naziv: pl?.Naziv || pl?.naziv || '',
        }))
        .filter((pl) => {
          if (locationIds.size === 0) return true;
          return locationIds.has(String(pl.LokacijaId || ''));
        });

      if (shouldStop()) return;
      setExistingLists(normalizedLists);

      let idToUse = '';
      if (preferredId && normalizedLists.some((pl) => String(pl.Id) === String(preferredId))){
        idToUse = preferredId;
      } else if (normalizedLists.length > 0) {
        idToUse = normalizedLists[0].Id;
      }

      if (!idToUse){
        if (shouldStop()) return;
        setCurrentListId('');
        setSelectedListId('');
        setMode('idle');
        setPreviousListId('');
        resetForm();
        return;
      }

      const data = await fetchPriceListData(idToUse, signal).catch(() => null);
      if (shouldStop()) return;
      if (data){
        applyPriceListData(data, signal);
      } else {
        setCurrentListId('');
        setSelectedListId('');
        setMode('idle');
        setPreviousListId('');
        resetForm();
      }
    } catch (err) {
      if (!signal?.aborted) toast.error('Ne mogu da učitam cenovnike.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [eventId, applyPriceListData, fetchPriceListData, resetForm]);

  useEffect(() => {
    if (!eventId) return;
    const controller = new AbortController();
    fetchListsAndApply({ signal: controller.signal });
    return () => controller.abort();
  }, [eventId, fetchListsAndApply]);

  useEffect(() => {
    if (eventId) return;
    setExistingLists([]);
    setCurrentListId('');
    setSelectedListId('');
    setMode('idle');
    resetForm();
  }, [eventId, resetForm]);

  useEffect(() => {
    function onLocationsUpdated(e){
      if (!eventId) return;
      const detailId = e?.detail?.eventId;
      if (detailId && String(detailId) !== String(eventId)) return;
      const list = e?.detail?.locations;
      if (Array.isArray(list)){
        setLocations(filterPriceableLocations(list));
        return;
      }
      locationsApi.listByEvent(eventId).then((locs) => setLocations(filterPriceableLocations(locs))).catch(() => {});
    }
    window.addEventListener('ne:locations:updated', onLocationsUpdated);
    return () => window.removeEventListener('ne:locations:updated', onLocationsUpdated);
  }, [eventId, filterPriceableLocations]);

  useEffect(() => {
    if (!locationId){
      if (defaultLocationId) setLocationId(defaultLocationId);
      return;
    }
    const exists = locations.some((loc) => String(locationsApi.normalizeId(loc) || '') === String(locationId));
    if (!exists){
      setLocationId(defaultLocationId || '');
    }
  }, [locations, locationId, defaultLocationId]);

  const startNew = () => {
    if (!hasEvent){
      toast.error('Sačuvaj osnovne informacije o događaju pre kreiranja cenovnika.');
      return;
    }
    setPreviousListId(currentListId || '');
    setCurrentListId('');
    setSelectedListId('');
    resetForm();
    const presetLocation = locationId || defaultLocationId;
    setLocationId(presetLocation || '');
    setMode('creating');
  };

  const handleSelectExisting = async (e) => {
    const value = e.target.value;
    if (!value){
      setSelectedListId('');
      setCurrentListId('');
      setMode('idle');
      resetForm();
      return;
    }
    setLoading(true);
    try {
      const data = await fetchPriceListData(value).catch(() => null);
      if (data){
        applyPriceListData(data);
      } else {
        toast.error('Ne mogu da učitam izabrani cenovnik.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleItemFieldChange = (field, value) => {
    setItemForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemFile = (file) => {
    if (!file){
      setItemForm((prev) => ({ ...prev, UrlSlika: '' }));
      return;
    }
    setItemForm((prev) => ({ ...prev, UrlSlika: file.name || '' }));
  };

  const validateItem = (item) => {
    if (!item.Naziv || !item.Naziv.trim()){
      toast.error('Naziv stavke je obavezan.');
      return false;
    }
    const price = Number(item.Cena);
    if (!Number.isFinite(price) || price < 0){
      toast.error('Cena mora biti nenegativan broj.');
      return false;
    }
    const qty = Number(item.Kolicina || 0);
    if (!Number.isFinite(qty) || qty < 0){
      toast.error('Količina mora biti nenegativan broj.');
      return false;
    }
    return true;
  };

  const addOrUpdateItem = (e) => {
    e?.preventDefault();
    const payload = {
      Naziv: (itemForm.Naziv || '').trim(),
      Opis: (itemForm.Opis || '').trim(),
      Cena: itemForm.Cena === '' ? '' : Number(itemForm.Cena),
      Kolicina: itemForm.Kolicina === '' ? '' : Number(itemForm.Kolicina),
      UrlSlika: itemForm.UrlSlika || '',
    };
    if (!validateItem(payload)) return;

    if (editingItemLocalId){
      setItems((prev) => prev.map((itm) => {
        if (itm.localId !== editingItemLocalId) return itm;
        return {
          ...itm,
          ...payload,
          status: itm.Id ? 'updated' : 'new',
        };
      }));
      toast.success('Stavka je ažurirana.');
    } else {
      setItems((prev) => ([
        ...prev,
        makeLocalItem({ ...payload, status: 'new' }),
      ]));
      toast.success('Stavka je dodata.');
    }
    setItemForm({ ...EMPTY_ITEM });
    setEditingItemLocalId(null);
  };

  const handleEditItem = (localId) => {
    const item = items.find((itm) => itm.localId === localId);
    if (!item) return;
    setItemForm({
      Naziv: item.Naziv,
      Opis: item.Opis,
      Cena: item.Cena,
      Kolicina: item.Kolicina,
      UrlSlika: item.UrlSlika,
    });
    setEditingItemLocalId(localId);
  };

  const handleRemoveItem = (localId) => {
    if (!window.confirm('Ukloniti stavku iz cenovnika?')) return;
    setItems((prev) => {
      const target = prev.find((itm) => itm.localId === localId);
      if (!target) return prev;
      if (target.Id){
        setRemovedIds((ids) => ids.includes(target.Id) ? ids : [...ids, target.Id]);
      }
      return prev.filter((itm) => itm.localId !== localId);
    });
    if (editingItemLocalId === localId){
      setItemForm({ ...EMPTY_ITEM });
      setEditingItemLocalId(null);
    }
  };

  const handleCancelItemEdit = () => {
    setItemForm({ ...EMPTY_ITEM });
    setEditingItemLocalId(null);
  };

  const validatePriceList = () => {
    const trimmed = (name || '').trim();
    if (!trimmed){
      toast.error('Unesi naziv cenovnika.');
      return false;
    }
    if (!locationId){
      toast.error('Odaberi lokaciju za cenovnik.');
      return false;
    }
    if (items.length === 0){
      toast.error('Dodaj bar jednu stavku pre čuvanja.');
      return false;
    }
    return true;
  };

  const handleCancel = async () => {
    if (mode === 'creating'){
      if (previousListId){
        await fetchListsAndApply({ preferredId: previousListId });
      } else {
        setMode('idle');
        setCurrentListId('');
        setSelectedListId('');
        resetForm();
      }
      setPreviousListId('');
    } else if (mode === 'editing' && currentListId){
      await fetchListsAndApply({ preferredId: currentListId });
      setMode('view');
      setPreviousListId('');
    }
  };

  const handleSaveNew = async () => {
    if (!validatePriceList()) return;
    setSaving(true);
    try {
      const payload = {
        Naziv: name.trim(),
        LokacijaId: locationId,
        StavkeIds: [],
      };
      const created = await priceListApi.createPriceList(payload);
      const createdId = created?.Id || created?.id || created?._id;
      if (!createdId) throw new Error('Nedostaje ID cenovnika.');

      const createdItems = [];
      const createdIds = [];
      for (const item of items){
        const dto = {
          Naziv: item.Naziv,
          Opis: item.Opis,
          Cena: Number(item.Cena || 0),
          Kolicina: Number(item.Kolicina || 0),
          URLslike: item.UrlSlika || '',
          CenovnikId: createdId,
        };
        const res = await priceListApi.createItem(dto).catch(() => null);
        const itemId = res?.Id || res?.id || res?._id;
        if (itemId){
          createdIds.push(itemId);
          createdItems.push({ ...item, Id: itemId, status: 'existing' });
        }
      }

      await priceListApi.updatePriceList(createdId, {
        Naziv: name.trim(),
        LokacijaId: locationId,
        StavkeIds: createdIds,
      }).catch(() => {});

      toast.success('Cenovnik je sačuvan.');
      setMode('view');
      setPreviousListId('');
      setCurrentListId(createdId);
      setSelectedListId(createdId);
      setItems(createdItems);
      await fetchListsAndApply({ preferredId: createdId });
    } catch (err) {
      toast.error('Greška pri čuvanju cenovnika.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!currentListId) return;
    if (!window.confirm('Obrisati ceo cenovnik?')) return;
    setSaving(true);
    try {
      for (const item of items){
        if (item.Id){
          await priceListApi.deleteItem(item.Id).catch(() => {});
        }
      }
      await priceListApi.deletePriceList(currentListId).catch(() => {});
      toast.success('Cenovnik je obrisan.');
      setCurrentListId('');
      setSelectedListId('');
      setMode('idle');
      setPreviousListId('');
      resetForm();
      await fetchListsAndApply();
    } catch {
      toast.error('Greška pri brisanju cenovnika.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!currentListId) return;
    if (!validatePriceList()) return;
    setSaving(true);
    try {
      for (const id of removedIds){
        await priceListApi.deleteItem(id).catch(() => {});
      }

      const nextItems = [];
      const idsForList = [];

      for (const item of items){
        if (item.Id){
          if (item.status === 'updated'){
            await priceListApi.updateItem(item.Id, {
              Naziv: item.Naziv,
              Opis: item.Opis,
              Cena: Number(item.Cena || 0),
              Kolicina: Number(item.Kolicina || 0),
              URLslike: item.UrlSlika || '',
              CenovnikId: currentListId,
            }).catch(() => {});
          }
          nextItems.push({ ...item, status: 'existing' });
          idsForList.push(item.Id);
        } else {
          const res = await priceListApi.createItem({
            Naziv: item.Naziv,
            Opis: item.Opis,
            Cena: Number(item.Cena || 0),
            Kolicina: Number(item.Kolicina || 0),
            URLslike: item.UrlSlika || '',
            CenovnikId: currentListId,
          }).catch(() => null);
          const newId = res?.Id || res?.id || res?._id;
          if (newId){
            idsForList.push(newId);
            nextItems.push({ ...item, Id: newId, status: 'existing' });
          }
        }
      }

      await priceListApi.updatePriceList(currentListId, {
        Naziv: name.trim(),
        LokacijaId: locationId,
        StavkeIds: idsForList,
      }).catch(() => {});

      toast.success('Cenovnik je ažuriran.');
      setMode('view');
      setPreviousListId('');
      setRemovedIds([]);
      setItems(nextItems);
      await fetchListsAndApply({ preferredId: currentListId });
    } catch {
      toast.error('Greška pri ažuriranju cenovnika.');
    } finally {
      setSaving(false);
    }
  };

  const renderControls = () => {
    if (mode === 'creating'){
      return (
        <div className="pl-controls">
          <button className="pl-btn" onClick={handleSaveNew} disabled={saving}>Sačuvaj</button>
          <button className="pl-btn pl-secondary" onClick={handleCancel} disabled={saving}>Otkaži</button>
        </div>
      );
    }
    if (mode === 'view'){
      const beginEdit = () => {
        setPreviousListId(currentListId);
        setMode('editing');
      };
      return (
        <div className="pl-controls">
          <button className="pl-btn" onClick={beginEdit} disabled={saving}>Izmeni</button>
          <button className="pl-btn pl-danger" onClick={handleDelete} disabled={saving}>Obriši</button>
        </div>
      );
    }
    if (mode === 'editing'){
      return (
        <div className="pl-controls">
          <button className="pl-btn" onClick={handleSaveChanges} disabled={saving}>Sačuvaj izmene</button>
          <button className="pl-btn pl-secondary" onClick={handleCancel} disabled={saving}>Odustani</button>
        </div>
      );
    }
    return (
      <div className="pl-controls">
        <button className="pl-btn" onClick={startNew} disabled={!hasEvent || loading || saving}>Dodaj cenovnik</button>
      </div>
    );
  };

  const locationNameById = useCallback((id) => {
    const match = (locations || []).find((loc) => String(locationsApi.normalizeId(loc)) === String(id));
    return match?.Naziv || match?.naziv || 'Lokacija';
  }, [locations]);

  return (
    <section className="pl-section">
      <div className="pl-header">
        <h2>Cenovnik</h2>
        {existingLists.length > 0 && (
          <select
            className="pl-select-existing"
            value={selectedListId}
            onChange={handleSelectExisting}
            disabled={loading || saving || mode === 'creating' || mode === 'editing'}
          >
            <option value="">-- Novi cenovnik --</option>
            {existingLists.map((pl) => (
              <option key={pl.Id} value={pl.Id}>
                {pl.Naziv || 'Cenovnik'} · {locationNameById(pl.LokacijaId)}
              </option>
            ))}
          </select>
        )}
        {mode === 'idle' && (
          <button className="pl-btn pl-btn-inline" onClick={startNew} disabled={!hasEvent || loading}>Novi cenovnik</button>
        )}
      </div>

      <div className="pl-topbar">
        <span className="pl-badge">{mode === 'creating' ? 'U izradi' : mode === 'editing' ? 'Uređivanje' : existingLists.length ? 'Postojeći cenovnik' : 'Nema cenovnika'}</span>
        {loading && <span className="pl-subtitle">Učitavanje...</span>}
      </div>

      <div className="pl-meta">
        <div className="pl-field">
          <label>Naziv cenovnika</label>
          <input
            className="pl-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!isEditable}
            placeholder="npr. Pića"
          />
        </div>
        <div className="pl-field">
          <label>Lokacija</label>
          <select
            className="pl-select"
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            disabled={!isEditable}
          >
            <option value="">-- Odaberi lokaciju --</option>
            {locations.map((loc) => {
              const id = String(locationsApi.normalizeId(loc) || '');
              return (
                <option key={id} value={id}>{loc?.Naziv || loc?.naziv || 'Lokacija'}</option>
              );
            })}
          </select>
        </div>
      </div>

      <div className="pl-content">
        <div className="pl-table-wrap">
          <table className="pl-table">
            <thead>
              <tr>
                <th>Naziv</th>
                <th>Opis</th>
                <th>Cena</th>
                <th>Količina</th>
                {isEditable && <th>Akcije</th>}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td className="pl-empty" colSpan={isEditable ? 5 : 4}>Nema stavki u cenovniku.</td>
                </tr>
              )}
              {items.map((item) => (
                <tr key={item.localId}>
                  <td>
                    {item.Naziv}
                    {item.status === 'new' && <span className="pl-pill">novo</span>}
                    {item.status === 'updated' && <span className="pl-pill">izmena</span>}
                  </td>
                  <td>{item.Opis || <span className="pl-hint">Nema opisa</span>}</td>
                  <td>{Number(item.Cena || 0).toLocaleString('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RSD</td>
                  <td>{Number(item.Kolicina || 0).toLocaleString('sr-RS')}</td>
                  {isEditable && (
                    <td>
                      <div className="pl-row-actions">
                        <button className="pl-btn pl-secondary" onClick={() => handleEditItem(item.localId)} type="button">Uredi</button>
                        <button className="pl-btn pl-danger" onClick={() => handleRemoveItem(item.localId)} type="button">Ukloni</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pl-form-wrap">
          <form className="pl-item-form" onSubmit={addOrUpdateItem}>
            <h3>{editingItemLocalId ? 'Izmeni stavku' : 'Nova stavka'}</h3>
            <div className="pl-field">
              <label>Naziv stavke</label>
              <input
                className="pl-input"
                value={itemForm.Naziv}
                onChange={(e) => handleItemFieldChange('Naziv', e.target.value)}
                disabled={!isEditable}
                placeholder="npr. Espresso"
              />
            </div>
            <div className="pl-field">
              <label>Opis</label>
              <textarea
                className="pl-textarea"
                value={itemForm.Opis}
                onChange={(e) => handleItemFieldChange('Opis', e.target.value)}
                disabled={!isEditable}
                rows={3}
                placeholder="Dodatne informacije"
              />
            </div>
            <div className="pl-item-grid">
              <div className="pl-field">
                <label>Cena (RSD)</label>
                <input
                  className="pl-input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={itemForm.Cena}
                  onChange={(e) => handleItemFieldChange('Cena', e.target.value)}
                  disabled={!isEditable}
                />
              </div>
              <div className="pl-field">
                <label>Količina</label>
                <input
                  className="pl-input"
                  type="number"
                  min="0"
                  step="1"
                  value={itemForm.Kolicina}
                  onChange={(e) => handleItemFieldChange('Kolicina', e.target.value)}
                  disabled={!isEditable}
                />
              </div>
            </div>
            <div className="pl-field">
              <label>Slika (opciono)</label>
              <input
                className="pl-file"
                type="file"
                onChange={(e) => handleItemFile(e.target.files?.[0] || null)}
                disabled={!isEditable}
              />
              {itemForm.UrlSlika && <span className="pl-hint">{itemForm.UrlSlika}</span>}
            </div>
            <div className="pl-row-actions">
              <button className="pl-btn" type="submit" disabled={!isEditable}>{editingItemLocalId ? 'Sačuvaj stavku' : 'Dodaj stavku'}</button>
              {editingItemLocalId && (
                <button className="pl-btn pl-secondary" type="button" onClick={handleCancelItemEdit}>Otkaži</button>
              )}
            </div>
          </form>
        </div>
      </div>

      {renderControls()}

      {!hasEvent && (
        <p className="pl-message">Sačuvaj osnovne informacije o događaju da bi mogao da dodaš cenovnik.</p>
      )}
    </section>
  );
}
