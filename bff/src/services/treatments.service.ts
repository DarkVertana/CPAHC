import { FastifyInstance } from 'fastify';
import { getOrderDetails } from './orders.service.js';
import { getCustomerOrders } from './orders.service.js';
import { Treatment } from '../schemas/treatment.schema.js';

interface WooCommerceOrder {
  id: number;
  date_created?: string;
  date_created_gmt?: string;
  meta_data?: Array<{
    key?: string;
    value?: unknown;
  }>;
}

/**
 * Parse treatment data from WooCommerce order meta_data
 * Maps ACF meta keys to stable treatment schema
 */
export function parseTreatmentFromOrder(order: WooCommerceOrder): Treatment | null {
  if (!order.meta_data || !Array.isArray(order.meta_data)) {
    return null;
  }

  // Look for treatment-related meta keys
  // Common ACF field patterns: treatment_*, medication_*, prescription_*
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const treatmentMeta: Record<string, any> = {};
  
  order.meta_data.forEach((meta) => {
    const key = meta.key?.toLowerCase() || '';
    
    // Map common ACF field names
    if (key.includes('treatment') || key.includes('medication') || key.includes('prescription')) {
      treatmentMeta[key] = meta.value;
    }
  });

  // If no treatment meta found, return null
  if (Object.keys(treatmentMeta).length === 0) {
    return null;
  }

  // Parse medications from meta
  const medications: Treatment['medications'] = [];
  
  // Try to extract medication data (this is a generic parser - adjust based on your ACF structure)
  if (treatmentMeta.medications || treatmentMeta.medication_list) {
    const meds = Array.isArray(treatmentMeta.medications || treatmentMeta.medication_list)
      ? treatmentMeta.medications || treatmentMeta.medication_list
      : [];
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    meds.forEach((med: any) => {
      medications.push({
        name: med.name || med.medication_name || 'Unknown',
        dosage: med.dosage || med.dose || '',
        frequency: med.frequency || med.times_per_day || '',
        instructions: med.instructions || med.notes || undefined,
      });
    });
  }

  // If no structured medications, try to parse from other fields
  if (medications.length === 0) {
    // Look for single medication fields
    const medName = treatmentMeta.medication_name || treatmentMeta.treatment_name;
    const medDosage = treatmentMeta.dosage || treatmentMeta.dose;
    const medFrequency = treatmentMeta.frequency || treatmentMeta.times_per_day;
    
    if (medName) {
      medications.push({
        name: medName,
        dosage: medDosage || '',
        frequency: medFrequency || '',
        instructions: treatmentMeta.instructions || treatmentMeta.notes || undefined,
      });
    }
  }

  return {
    orderId: order.id,
    orderDate: order.date_created || order.date_created_gmt || '',
    medications,
    nextRefillDate: treatmentMeta.next_refill_date || treatmentMeta.refill_date || undefined,
    notes: treatmentMeta.notes || treatmentMeta.treatment_notes || undefined,
  };
}

/**
 * Get treatment for a specific order
 */
export async function getOrderTreatment(
  fastify: FastifyInstance,
  orderId: number
): Promise<Treatment | null> {
  const order = await getOrderDetails(fastify, orderId);
  if (!order) {
    return null;
  }

  // Fetch full order with meta_data
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fullOrder = await fastify.woo.get(`/orders/${orderId}`) as any;
    return parseTreatmentFromOrder(fullOrder as WooCommerceOrder);
  } catch {
    return null;
  }
}

/**
 * Get all orders with treatments
 */
export async function getOrdersWithTreatments(
  fastify: FastifyInstance,
  customerId: number,
  page: number = 1,
  perPage: number = 20
): Promise<{ orders: Array<{ order: { id: number; number: string; status: string; date_created: string; total: string }; treatment: Treatment | null }>; total: number; pages: number }> {
  const { orders } = await getCustomerOrders(fastify, customerId, page, perPage);

  // Fetch full orders with meta_data to parse treatments
  const ordersWithTreatments = await Promise.all(
    orders.map(async (order) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fullOrder = await fastify.woo.get(`/orders/${order.id}`) as any;
        const treatment = parseTreatmentFromOrder(fullOrder as WooCommerceOrder);
        return {
          order: {
            id: order.id,
            number: order.number,
            status: order.status,
            date_created: order.date_created,
            total: order.total,
          },
          treatment,
        };
      } catch {
        return {
          order: {
            id: order.id,
            number: order.number,
            status: order.status,
            date_created: order.date_created,
            total: order.total,
          },
          treatment: null,
        };
      }
    })
  );

  // Filter to only orders with treatments
  const filtered = ordersWithTreatments.filter(item => item.treatment !== null);

  return {
    orders: filtered,
    total: filtered.length,
    pages: Math.ceil(filtered.length / perPage),
  };
}
