import React, { useState, useEffect } from "react";
import { MapPin, Navigation, ChevronDown, ChevronUp, Store, CheckCircle2 } from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import AdministrativeService, { AdministrativeProvinceDTO, AdministrativeCommuneDTO } from "../../services/administrativeService";

export interface LocationSelectorProps {
  className?: string;
  stores?: Array<{ id: string | number; name: string; address: string; serviceArea?: string; city?: string; district?: string }>;
  selectedStoreId?: string | number | null;
  onSelectStore?: (id: string) => void;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  className = "",
  stores: propStores,
  selectedStoreId: propSelectedStoreId,
  onSelectStore: propOnSelectStore
}) => {
  const {
    userLocation,
    setUserLocation,
    stores: contextStores,
    selectedStoreId: contextSelectedStoreId,
    setSelectedStoreId: contextSetSelectedStoreId
  } = useAppContext();

  const [isExpanded, setIsExpanded] = useState(false);

  const [provincesList, setProvincesList] = useState<AdministrativeProvinceDTO[]>([]);
  const [communesList, setCommunesList] = useState<AdministrativeCommuneDTO[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCommunes, setLoadingCommunes] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchProvinces = async () => {
      setLoadingProvinces(true);
      try {
        const data = await AdministrativeService.getProvinces();
        if (isMounted) setProvincesList(data);
      } catch (err) {
        // Silently handled
      } finally {
        if (isMounted) setLoadingProvinces(false);
      }
    };
    fetchProvinces();
    return () => { isMounted = false; };
  }, []);

  // Fetch communes if city is already selected
  useEffect(() => {
    let isMounted = true;
    if (userLocation.city && provincesList.length > 0) {
      const prov = provincesList.find(p => p.name === userLocation.city);
      if (prov) {
        setLoadingCommunes(true);
        AdministrativeService.getCommunesByProvince(prov.id).then(communes => {
          if (isMounted) setCommunesList(communes);
        }).finally(() => {
          if (isMounted) setLoadingCommunes(false);
        });
      }
    }
    return () => { isMounted = false; };
  }, [userLocation.city, provincesList]);

  // Use props if provided, otherwise context
  const stores = propStores || contextStores || [];
  const activeSelectedStoreId = propSelectedStoreId !== undefined
    ? (propSelectedStoreId !== null ? String(propSelectedStoreId) : null)
    : contextSelectedStoreId;

  const handleSelectStore = (id: string | number) => {
    const stringId = String(id);
    if (propOnSelectStore) {
      propOnSelectStore(stringId);
    } else if (contextSetSelectedStoreId) {
      contextSetSelectedStoreId(activeSelectedStoreId === stringId ? null : stringId);
    }
  };

  const handleCityChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cityName = e.target.value;
    const prov = provincesList.find(p => p.name === cityName);
    setUserLocation({
      city: cityName,
      district: "",
      address: cityName ? `${cityName}, Việt Nam` : ""
    });
    setCommunesList([]);
    if (prov) {
      setLoadingCommunes(true);
      try {
        const communes = await AdministrativeService.getCommunesByProvince(prov.id);
        setCommunesList(communes);
      } catch (err) {
        // Silently handled
      } finally {
        setLoadingCommunes(false);
      }
    }
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const communeDisplayName = e.target.value;
    setUserLocation({
      ...userLocation,
      district: communeDisplayName,
      address: `${communeDisplayName}, ${userLocation.city}, Việt Nam`
    });
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserLocation({
      ...userLocation,
      address: e.target.value
    });
  };

  // Filter stores for the selected city
  const cityStores = stores.filter(s => !s.city || s.city === userLocation.city);
  const selectedStore = stores.find(s => String(s.id) === activeSelectedStoreId);

  const displayLocation = userLocation.district
    ? `Quận ${userLocation.district}, ${userLocation.city}`
    : userLocation.city || "Chưa chọn vị trí";

  return (
    <div className={`bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] rounded-2xl shadow-xs transition-all duration-250 ease-in-out ${className}`}>
      {/* Summary Trigger Card (Collapsed Header) */}
      <div className="p-4 sm:p-4.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-xl bg-[var(--gl-accent-soft)] flex items-center justify-center shrink-0 border border-[var(--gl-accent)]/20">
            <MapPin className="h-5 w-5 text-[var(--gl-accent)]" />
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold tracking-wider text-[var(--gl-accent)] uppercase">
                GIAO ĐẾN
              </span>
              {selectedStore ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[var(--gl-accent-soft)] text-[var(--gl-accent)] border border-[var(--gl-accent)]/20 max-w-[200px] truncate">
                  <Store className="w-3 h-3 shrink-0" />
                  <span className="truncate">{selectedStore.name}</span>
                </span>
              ) : (
                <span className="text-[10px] text-[var(--gl-text-muted)] italic">
                  Chưa chọn nhà vườn cung ứng
                </span>
              )}
            </div>
            <h4 className="text-xs sm:text-sm font-semibold text-[var(--gl-text-primary)] truncate">
              {userLocation.address || displayLocation}
            </h4>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-controls="location-selector-panel"
          aria-label={isExpanded ? "Thu gọn vị trí & nhà vườn" : "Thay đổi vị trí & nhà vườn"}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[44px] bg-[var(--gl-bg-muted)] hover:bg-[var(--gl-bg-elevated)] border border-[var(--gl-border)] text-[var(--gl-text-primary)] text-xs font-semibold rounded-xl transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] shrink-0 w-full sm:w-auto"
        >
          <span>Thay đổi</span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-[var(--gl-text-muted)] shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[var(--gl-text-muted)] shrink-0" />
          )}
        </button>
      </div>

      {/* Expanded Panel */}
      {isExpanded && (
        <div
          id="location-selector-panel"
          className="p-4 sm:p-5 pt-0 border-t border-[var(--gl-border)] mt-1 animate-in fade-in slide-in-from-top-2 duration-250 motion-reduce:transition-none"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-4">
            {/* Left Column: Address Configuration (~55%) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-[var(--gl-accent-soft)] border border-[var(--gl-border-subtle)] rounded-xl px-3 py-2.5 flex items-center justify-between gap-2 min-h-[54px]">
                <div className="space-y-0.5 min-w-0">
                  <h5 className="text-xs sm:text-sm font-semibold text-[var(--gl-text-primary)] flex items-center gap-1.5 truncate">
                    <Navigation className="w-4 h-4 text-[var(--gl-accent)] shrink-0" />
                    <span>Vị trí nhận hàng</span>
                  </h5>
                  <p className="text-[11px] text-[var(--gl-text-secondary)] truncate">
                    Dùng để tìm nhà vườn và dịch vụ gần bạn.
                  </p>
                </div>
              </div>

              <div className="space-y-3.5">
                {/* City Select */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--gl-text-secondary)] block">
                    Tỉnh / Thành phố:
                  </label>
                  <select
                    value={userLocation.city || ""}
                    onChange={handleCityChange}
                    disabled={loadingProvinces}
                    className="w-full bg-[var(--gl-bg-muted)] text-[var(--gl-text-primary)] border border-[var(--gl-border)] focus:border-[var(--gl-accent)] focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] rounded-xl py-2.5 px-3 text-xs focus:outline-none cursor-pointer min-h-[44px] font-medium transition-colors disabled:opacity-60"
                  >
                    <option value="" disabled className="bg-[var(--gl-bg-surface)] text-[var(--gl-text-muted)]">
                      {loadingProvinces ? "Đang tải dữ liệu địa chỉ..." : "-- Chọn Tỉnh / Thành phố --"}
                    </option>
                    {provincesList.map((prov) => (
                      <option key={prov.id} value={prov.name} className="bg-[var(--gl-bg-surface)] text-[var(--gl-text-primary)]">{prov.name}</option>
                    ))}
                  </select>
                </div>

                {/* Commune / Ward Select */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--gl-text-secondary)] block">
                    Xã / Phường / Đặc khu:
                  </label>
                  <select
                    value={userLocation.district || ""}
                    onChange={handleDistrictChange}
                    disabled={!userLocation.city || loadingCommunes}
                    className="w-full bg-[var(--gl-bg-muted)] text-[var(--gl-text-primary)] border border-[var(--gl-border)] focus:border-[var(--gl-accent)] focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] rounded-xl py-2.5 px-3 text-xs focus:outline-none cursor-pointer min-h-[44px] font-medium transition-colors disabled:opacity-60"
                  >
                    <option value="" disabled className="bg-[var(--gl-bg-surface)] text-[var(--gl-text-muted)]">
                      {!userLocation.city
                        ? "-- Vui lòng chọn Tỉnh / Thành phố trước --"
                        : loadingCommunes
                          ? "Đang tải dữ liệu địa chỉ..."
                          : communesList.length === 0
                            ? "Dữ liệu xã/phường của tỉnh/thành này chưa có."
                            : "-- Chọn Xã / Phường / Đặc khu --"}
                    </option>
                    {communesList.map((c) => (
                      <option key={c.code} value={c.displayName} className="bg-[var(--gl-bg-surface)] text-[var(--gl-text-primary)]">
                        {c.displayName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Detail Address Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--gl-text-secondary)] block">
                    Địa chỉ chi tiết (Số nhà, tên đường):
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={userLocation.address}
                      onChange={handleAddressChange}
                      placeholder="Ví dụ: 100 Lê Lợi"
                      className="w-full bg-[var(--gl-bg-muted)] text-[var(--gl-text-primary)] border border-[var(--gl-border)] focus:border-[var(--gl-accent)] focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] rounded-xl py-2.5 pl-3 pr-10 text-xs focus:outline-none min-h-[44px] font-medium placeholder:text-[var(--gl-text-muted)] transition-colors"
                    />
                    <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--gl-accent)] pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Stores List (~45%) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-[var(--gl-accent-soft)] border border-[var(--gl-border-subtle)] rounded-xl px-3 py-2.5 flex items-center justify-between gap-2 min-h-[54px]">
                <div className="space-y-0.5 min-w-0">
                  <h5 className="text-xs sm:text-sm font-semibold text-[var(--gl-text-primary)] flex items-center gap-1.5 truncate">
                    <Store className="w-4 h-4 text-[var(--gl-accent)] shrink-0" />
                    <span>Nhà vườn gần bạn</span>
                  </h5>
                  <p className="text-[11px] text-[var(--gl-text-secondary)] truncate">
                    Danh sách nhà vườn sẵn sàng cung ứng.
                  </p>
                </div>
                {cityStores.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[var(--gl-bg-surface)] text-[var(--gl-accent)] border border-[var(--gl-accent)]/20 shrink-0">
                    {cityStores.length} nhà vườn
                  </span>
                )}
              </div>

              {cityStores.length === 0 ? (
                /* Soft Empty State Card (Height ~140-180px) */
                <div className="min-h-[150px] max-h-[180px] flex flex-col items-center justify-center text-center p-4 rounded-xl border border-dashed border-[var(--gl-border)] bg-[var(--gl-bg-muted)]/50 space-y-2">
                  <Store className="w-7 h-7 text-[var(--gl-text-muted)]" />
                  <div className="space-y-1">
                    <h6 className="font-bold text-xs text-[var(--gl-text-primary)]">
                      Chưa có nhà vườn tại khu vực này
                    </h6>
                    <p className="text-[11px] text-[var(--gl-text-muted)] max-w-xs leading-relaxed">
                      Bạn vẫn có thể xem sản phẩm trên toàn hệ thống hoặc thử chọn khu vực khác.
                    </p>
                  </div>
                </div>
              ) : (
                /* Selectable Stores List */
                <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                  {cityStores.map((store) => {
                    const isSelected = activeSelectedStoreId === String(store.id);
                    return (
                      <div
                        key={store.id}
                        onClick={() => handleSelectStore(store.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? "border-[var(--gl-accent)] bg-[var(--gl-accent-soft)]/30 text-[var(--gl-accent)] font-bold shadow-xs"
                            : "border-[var(--gl-border)] bg-[var(--gl-bg-surface)] hover:border-[var(--gl-border-subtle)] hover:bg-[var(--gl-bg-muted)]/60 text-[var(--gl-text-secondary)]"
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2.5">
                          <div className="space-y-1 min-w-0 flex-1">
                            <h6 className="text-xs font-bold leading-snug text-[var(--gl-text-primary)] truncate">
                              {store.name}
                            </h6>
                            <p className="text-[11px] text-[var(--gl-text-secondary)] truncate">
                              {store.address}
                            </p>
                            {store.serviceArea && (
                              <p className="text-[10px] text-[var(--gl-text-muted)] font-mono">
                                Khu vực: <span className="text-[var(--gl-accent)]">{store.serviceArea}</span>
                              </p>
                            )}
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold shrink-0 inline-flex items-center gap-1 ${
                              isSelected
                                ? "bg-[var(--gl-accent)] text-white dark:text-emerald-950"
                                : "bg-[var(--gl-bg-muted)] text-[var(--gl-text-muted)]"
                            }`}
                          >
                            {isSelected && <CheckCircle2 className="w-3 h-3" />}
                            {isSelected ? "ĐANG CHỌN" : "CHỌN"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
