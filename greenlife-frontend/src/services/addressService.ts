import { UserAddress } from "../types";
import { HttpClient } from "./httpClient";

export class AddressService {
  public static mapBackendToUserAddress(backend: any): UserAddress {
    return {
      address_id: backend.id,
      user_id: "",
      fullname: backend.recipientName || "",
      phone: backend.phone || "",
      province: backend.city || "",
      district: backend.district || "",
      ward: backend.ward || "",
      detail_address: backend.addressLine || "",
      is_default: backend.isDefault || false,
      is_pickup: false,
      type: "home"
    };
  }

  public static mapUserAddressToBackend(frontend: Partial<UserAddress>) {
    return {
      recipientName: frontend.fullname,
      phone: frontend.phone,
      addressLine: frontend.detail_address,
      ward: frontend.ward,
      district: frontend.district,
      city: frontend.province,
      isDefault: frontend.is_default || false
    };
  }

  public static async getAddresses(signal?: AbortSignal): Promise<UserAddress[]> {
    const data = await HttpClient.get<any[]>("/api/addresses", { signal });
    return (data || []).map(this.mapBackendToUserAddress);
  }

  public static async getDefaultAddress(signal?: AbortSignal): Promise<UserAddress | null> {
    try {
      const data = await HttpClient.get("/api/addresses/default", { signal });
      if (!data) return null;
      return this.mapBackendToUserAddress(data);
    } catch {
      return null;
    }
  }

  public static async createAddress(address: Partial<UserAddress>, signal?: AbortSignal): Promise<UserAddress> {
    const data = await HttpClient.post("/api/addresses", this.mapUserAddressToBackend(address), { signal });
    return this.mapBackendToUserAddress(data);
  }

  public static async updateAddress(id: number, address: Partial<UserAddress>, signal?: AbortSignal): Promise<UserAddress> {
    const data = await HttpClient.put(`/api/addresses/${id}`, this.mapUserAddressToBackend(address), { signal });
    return this.mapBackendToUserAddress(data);
  }

  public static async setDefaultAddress(id: number, signal?: AbortSignal): Promise<UserAddress> {
    const data = await HttpClient.put(`/api/addresses/${id}/default`, {}, { signal });
    return this.mapBackendToUserAddress(data);
  }

  public static async deleteAddress(id: number, signal?: AbortSignal): Promise<void> {
    await HttpClient.delete(`/api/addresses/${id}`, { signal });
  }
}
export default AddressService;
