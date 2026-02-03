/**
 * 🔐 Система узнавания постоянных клиентов БЕЗ регистрации
 * 
 * Использует 3 метода:
 * 1. localStorage (быстрое автозаполнение)
 * 2. Телефон в базе (работает на любом устройстве)
 * 3. Device ID (уникальный код устройства)
 */

export interface CustomerData {
  name: string;
  phone: string;
  address: string;
  deviceId?: string;
  isReturning?: boolean;
  totalOrders?: number;
}

/**
 * Генерирует уникальный ID устройства (1 раз при первом посещении)
 */
export function getDeviceId(): string {
  const STORAGE_KEY = 'delivery_device_id';
  
  let deviceId = localStorage.getItem(STORAGE_KEY);
  
  if (!deviceId) {
    // Генерируем уникальный ID: timestamp + random
    deviceId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(STORAGE_KEY, deviceId);
    console.log('🆕 Новый device ID создан:', deviceId);
  }
  
  return deviceId;
}

/**
 * Сохраняет данные клиента в localStorage для быстрого доступа
 */
export function saveCustomerLocally(data: CustomerData): void {
  const STORAGE_KEY = 'delivery_customer_data';
  
  const savedData = {
    ...data,
    deviceId: getDeviceId(),
    lastSaved: new Date().toISOString()
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData));
  console.log('💾 Данные клиента сохранены локально');
}

/**
 * Загружает данные клиента из localStorage
 */
export function loadCustomerLocally(): CustomerData | null {
  const STORAGE_KEY = 'delivery_customer_data';
  
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    
    const data = JSON.parse(saved);
    console.log('✅ Данные клиента загружены из localStorage');
    return data;
  } catch (error) {
    console.error('❌ Ошибка загрузки данных:', error);
    return null;
  }
}

/**
 * Ищет клиента в базе по телефону
 */
export async function findCustomerByPhone(phone: string): Promise<CustomerData | null> {
  if (!phone || phone.length < 9) return null;
  
  try {
    const response = await fetch(`/api/customers?phone=${encodeURIComponent(phone)}`);
    
    if (!response.ok) return null;
    
    const data = await response.json();
    console.log('🔍 Найден постоянный клиент:', data);
    return data;
  } catch (error) {
    console.error('❌ Ошибка поиска клиента:', error);
    return null;
  }
}

/**
 * Автозаполнение формы при вводе телефона
 */
export async function autofillCustomerData(phone: string): Promise<CustomerData | null> {
  // 1. Сначала пробуем localStorage (быстро)
  const localData = loadCustomerLocally();
  if (localData && localData.phone === phone) {
    console.log('⚡ Автозаполнение из localStorage');
    return localData;
  }
  
  // 2. Ищем в базе (работает на любом устройстве)
  const dbData = await findCustomerByPhone(phone);
  if (dbData) {
    // Сохраняем в localStorage для следующего раза
    saveCustomerLocally(dbData);
    console.log('🔄 Автозаполнение из базы данных');
    return dbData;
  }
  
  console.log('🆕 Новый клиент');
  return null;
}

/**
 * Очистка данных (для тестирования или logout)
 */
export function clearCustomerData(): void {
  localStorage.removeItem('delivery_customer_data');
  // Device ID НЕ удаляем - он постоянный для устройства
  console.log('🗑️ Данные клиента очищены');
}
