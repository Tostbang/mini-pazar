/**
 * Backend henüz rol enum'unu yayınlamadığı için roleId değerini
 * bilinen en yaygın kalıplarla eşliyoruz. Admin kullanıcılar API
 * tarafından listelenmediğinden burada yalnızca müşteri tarafı
 * roller görünür; ileride backend yeni bir rol eklediğinde
 * burası tek bir yerde güncellenebilir.
 */
const KNOWN_ROLE_LABELS: Record<number, string> = {
  2: "Müşteri",
  3: "Mağaza Sahibi",
};

export function getUserRoleLabel(roleId: number | undefined | null) {
  if (roleId == null) return "—";
  return KNOWN_ROLE_LABELS[roleId] ?? `Rol #${roleId}`;
}