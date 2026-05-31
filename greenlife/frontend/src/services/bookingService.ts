import { Appointment } from "../types";
import { MOCK_BOOKINGS } from "../data";

export class BookingService {
  private static STORAGE_KEY = "greenlife_appointments";

  private static async delay(ms = 300): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Retrieves active professional consultant appointments
   */
  public static async getAppointments(): Promise<Appointment[]> {
    await this.delay(200);
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (err) {
        // Fallback to presets
      }
    }
    // Seed initial on first use
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(MOCK_BOOKINGS));
    return MOCK_BOOKINGS;
  }

  /**
   * Reserves a slot with an industry botanist
   */
  public static async bookAppointment(appointment: Omit<Appointment, "id" | "status">): Promise<Appointment> {
    await this.delay(400);
    const bookings = await this.getAppointments();
    
    const newBooking: Appointment = {
      ...appointment,
      id: `booking-${Date.now()}`,
      status: "confirmed" // Auto-approve simulation
    };

    const updated = [newBooking, ...bookings];
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    return newBooking;
  }

  /**
   * Cancels scheduled slot
   */
  public static async cancelAppointment(id: string): Promise<Appointment[]> {
    await this.delay(250);
    const bookings = await this.getAppointments();
    const updated = bookings.filter((b) => b.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    return updated;
  }
}
