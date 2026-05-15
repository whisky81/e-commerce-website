// frontend/src/components/AddressForm.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { getProvinces, getDistricts, getWards } from "../api/v3/addresses";
import { useGeocoding } from "../hooks/useGeocoding";
import MapPicker from "./MapPicker";

const EMPTY_FORM = {
  fullName: "",
  phone: "",
  street: "",
  provinceId: "",
  districtId: "",
  wardCode: "",
  isDefault: false,
  lat: null,
  lng: null,
  placeId: null,
};

function Field({ label, required, error, children }) {
  return (
    <div className="mb-3.5">
      <label className="block text-sm text-slate-700 font-medium mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function AddressForm({ onSubmit, onCancel, initialData = null, saving = false }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  // 3-level dropdown data
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [pickedLocation, setPickedLocation] = useState(null);

  // ── Forward geocoding for typed address → map sync ──────────────────
  const { searchAddress, loading: geocodingLoading } = useGeocoding();
  const fromMapRef = useRef(false); // true when last street change came from map pick
  const geocodeTimer = useRef(null);

  const mapPosition = pickedLocation ? [pickedLocation.lat, pickedLocation.lng] : null;

  useEffect(() => {
    if (initialData) {
      // Normalize: backend stores provinceId/districtId as numbers, but select values are strings
      setForm({
        ...EMPTY_FORM,
        ...initialData,
        provinceId: initialData.provinceId != null ? String(initialData.provinceId) : "",
        districtId: initialData.districtId != null ? String(initialData.districtId) : "",
        wardCode: initialData.wardCode != null ? String(initialData.wardCode) : "",
      });
    }
  }, [initialData]);

  // Load provinces on mount
  useEffect(() => {
    const load = async () => {
      setLoadingProvinces(true);
      try {
        const res = await getProvinces();
        if (res.data.success) setProvinces(res.data.data || []);
      } catch { /* silently fail */ }
      finally { setLoadingProvinces(false); }
    };
    load();
  }, []);

  // Load districts when province changes
  useEffect(() => {
    if (!form.provinceId) { setDistricts([]); return; }
    const load = async () => {
      setLoadingDistricts(true);
      try {
        const res = await getDistricts(form.provinceId);
        if (res.data.success) setDistricts(res.data.data || []);
      } catch { /* silently fail */ }
      finally { setLoadingDistricts(false); }
    };
    load();
  }, [form.provinceId]);

  // Load wards when district changes
  useEffect(() => {
    if (!form.districtId) { setWards([]); return; }
    const load = async () => {
      setLoadingWards(true);
      try {
        const res = await getWards(form.districtId);
        if (res.data.success) setWards(res.data.data || []);
      } catch { /* silently fail */ }
      finally { setLoadingWards(false); }
    };
    load();
  }, [form.districtId]);

  // ── Forward-geocode typed street to update map position (debounced) ──
  useEffect(() => {
    if (fromMapRef.current) {
      fromMapRef.current = false;
      return;
    }
    if (!form.street || form.street.trim().length < 5) return;

    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    geocodeTimer.current = setTimeout(async () => {
      const results = await searchAddress(form.street);
      if (results && results.length > 0) {
        const r = results[0];
        setPickedLocation({
          lat: parseFloat(r.lat),
          lng: parseFloat(r.lon),
          placeId: String(r.place_id),
          display_name: r.display_name,
        });
        // Sync lat/lng/placeId from geocode result (but don't overwrite user's street text)
        setForm((f) => ({
          ...f,
          lat: parseFloat(r.lat),
          lng: parseFloat(r.lon),
          placeId: String(r.place_id),
        }));
      }
    }, 800);

    return () => {
      if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    };
  }, [form.street]);

  const set = useCallback((key, val) => {
    setForm((f) => {
      const next = { ...f, [key]: val };
      // Reset downstream selections
      if (key === "provinceId") { next.districtId = ""; next.wardCode = ""; }
      if (key === "districtId") { next.wardCode = ""; }
      // Clear geo coordinates when user manually changes address fields
      if (key === "street" && !fromMapRef.current) {
        next.lat = null;
        next.lng = null;
        next.placeId = null;
        setPickedLocation(null);
      }
      if (key === "provinceId" || key === "districtId" || key === "wardCode") {
        next.lat = null;
        next.lng = null;
        next.placeId = null;
        setPickedLocation(null);
      }
      return next;
    });
  }, []);

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = "Vui lòng nhập họ tên";
    if (!/^(?:\+84|84|0)(3|5|7|8|9)\d{8}$/.test(form.phone))
      e.phone = "Số điện thoại không hợp lệ";
    if (!form.street.trim()) e.street = "Vui lòng nhập địa chỉ";
    if (!form.provinceId) e.provinceId = "Vui lòng chọn tỉnh/thành";
    if (!form.districtId) e.districtId = "Vui lòng chọn quận/huyện";
    if (!form.wardCode) e.wardCode = "Vui lòng chọn phường/xã";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const provinceName = provinces.find((p) => String(p.id) === String(form.provinceId))?.name || "";
    const districtName = districts.find((d) => String(d.id) === String(form.districtId))?.name || "";
    const wardName = wards.find((w) => String(w.id) === String(form.wardCode))?.name || "";

    onSubmit({
      fullName: form.fullName,
      phone: form.phone,
      street: form.street,
      provinceId: Number(form.provinceId),
      districtId: Number(form.districtId),
      wardCode: String(form.wardCode),
      province: provinceName,
      district: districtName,
      ward: wardName,
      isDefault: form.isDefault,
      lat: form.lat,
      lng: form.lng,
      placeId: form.placeId,
    });
  };

  const selectClass =
    "w-full box-border px-3 py-2.5 text-sm rounded-xl border border-slate-300 bg-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all";
  const inpClass = (key) =>
    `w-full box-border px-3 py-2.5 text-sm rounded-xl border outline-none transition-all ${
      errors[key]
        ? "border-red-500 bg-red-50 focus:ring-2 focus:ring-red-100"
        : "border-slate-300 bg-slate-50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
    }`;

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <Field label="Họ và tên" required error={errors.fullName}>
            <input
              value={form.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              className={inpClass("fullName")}
              placeholder="Nguyễn Văn A"
            />
          </Field>
          <Field label="Số điện thoại" required error={errors.phone}>
            <input
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              className={inpClass("phone")}
              placeholder="0912345678"
            />
          </Field>
        </div>

        <Field label="Số nhà, tên đường" required error={errors.street}>
          <div className="relative">
            <input
              value={form.street}
              onChange={(e) => set("street", e.target.value)}
              className={inpClass("street")}
              placeholder="123 Đường Láng"
            />
            {geocodingLoading && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-400 border-t-transparent inline-block" />
              </span>
            )}
          </div>
        </Field>

        {/* Map picker toggle */}
        <div className="mb-3.5">
          <button
            type="button"
            onClick={() => setShowMap(!showMap)}
            className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {showMap ? 'Ẩn bản đồ' : 'Chọn vị trí trên bản đồ'}
          </button>
          {pickedLocation && (
            <span className="ml-3 text-xs text-emerald-600 font-medium">
              Đã chọn vị trí ({pickedLocation.lat.toFixed(4)}, {pickedLocation.lng.toFixed(4)})
            </span>
          )}
        </div>

        {showMap && (
          <MapPicker
            position={mapPosition}
            onPick={async (result) => {
              fromMapRef.current = true;
              setPickedLocation({ lat: result.lat, lng: result.lng, placeId: result.placeId, display_name: result.display_name });

              // ── Build new form fields ─────────────────────────────
              const next = {
                lat: result.lat,
                lng: result.lng,
                placeId: result.placeId || String(result.placeId || ""),
                street: result.street || result.display_name || "",
              };

              // ── Map → Dropdown sync: match reverse-geocode names to GHN codes ──
              const { ward: revWard, district: revDistrict, province: revProvince } = result;

              // Helper: normalize Vietnamese names for comparison
              const normalize = (s) =>
                (s || "").toLowerCase().replace(/^(thành phố|tỉnh|quận|huyện|thị xã|phường|xã|thị trấn)\s+/i, "").trim();
              // Fuzzy match: check if one contains the other (for name extension variations)
              const nameMatch = (a, b) => {
                const na = normalize(a);
                const nb = normalize(b);
                return na === nb || na.includes(nb) || nb.includes(na);
              };

              if (revProvince && provinces.length > 0) {
                const matchProvince = provinces.find(
                  (p) => nameMatch(p.name, revProvince)
                );
                if (matchProvince) {
                  next.provinceId = String(matchProvince.id);

                  // Load districts for matched province, then try to match district
                  try {
                    const distRes = await getDistricts(matchProvince.id);
                    if (distRes.data.success) {
                      const distList = distRes.data.data || [];
                      setDistricts(distList);

                      if (revDistrict) {
                        const matchDistrict = distList.find(
                          (d) => nameMatch(d.name, revDistrict)
                        );
                        if (matchDistrict) {
                          next.districtId = String(matchDistrict.id);

                          // Load wards for matched district, then try to match ward
                          try {
                            const wardRes = await getWards(matchDistrict.id);
                            if (wardRes.data.success) {
                              const wardList = wardRes.data.data || [];
                              setWards(wardList);

                              if (revWard) {
                                const matchWard = wardList.find(
                                  (w) => nameMatch(w.name, revWard)
                                );
                                if (matchWard) {
                                  next.wardCode = String(matchWard.id);
                                }
                              }
                            }
                          } catch { /* silently fail ward matching */ }
                        }
                      }
                    }
                  } catch { /* silently fail district matching */ }
                }
              }

              setForm((f) => ({ ...f, ...next }));
            }}
          />
        )}

        {/* 3-level dropdown */}
        <Field label="Tỉnh/Thành phố" required error={errors.provinceId}>
          <select
            value={form.provinceId}
            onChange={(e) => set("provinceId", e.target.value)}
            className={selectClass}
            disabled={loadingProvinces}
          >
            <option value="">
              {loadingProvinces ? "Đang tải..." : "Chọn tỉnh/thành phố"}
            </option>
            {provinces.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <Field label="Quận/Huyện" required error={errors.districtId}>
            <select
              value={form.districtId}
              onChange={(e) => set("districtId", e.target.value)}
              className={selectClass}
              disabled={!form.provinceId || loadingDistricts}
            >
              <option value="">
                {!form.provinceId
                  ? "Chọn tỉnh/thành trước"
                  : loadingDistricts
                  ? "Đang tải..."
                  : "Chọn quận/huyện"}
              </option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Phường/Xã" required error={errors.wardCode}>
            <select
              value={form.wardCode}
              onChange={(e) => set("wardCode", e.target.value)}
              className={selectClass}
              disabled={!form.districtId || loadingWards}
            >
              <option value="">
                {!form.districtId
                  ? "Chọn quận/huyện trước"
                  : loadingWards
                  ? "Đang tải..."
                  : "Chọn phường/xã"}
              </option>
              {wards.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="flex items-center gap-2 mb-5">
          <input
            type="checkbox"
            id="isDefault"
            checked={form.isDefault}
            onChange={(e) => set("isDefault", e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-indigo-600 cursor-pointer focus:ring-2 focus:ring-indigo-500"
          />
          <label htmlFor="isDefault" className="text-sm text-slate-600 cursor-pointer select-none">
            Đặt làm địa chỉ mặc định
          </label>
        </div>

        <div className="flex gap-2.5 justify-end mt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              Hủy
            </button>
          )}
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[120px] justify-center"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                Đang lưu...
              </>
            ) : (
              "Lưu địa chỉ"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddressForm;
