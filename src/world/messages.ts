export function worldError(error: unknown, t: (ar: string, en: string) => string): string {
  const code = error instanceof Error ? error.message : String(error)
  if (/insufficient|balance|funds/i.test(code)) return t('رصيدك لا يكفي لهذه العملية. أكمل مهمة وعد إلى مدينتك.', 'Your balance is too low. Complete an activity and return to your city.')
  if (/level|locked/i.test(code)) return t('هذا العنصر يُفتح في مستوى مدينة أعلى.', 'This item unlocks at a higher city level.')
  if (/collision|occupied|overlap/i.test(code)) return t('هذه المساحة مشغولة. اختر بلاطات خالية.', 'This space is occupied. Choose clear tiles.')
  if (/bounds|outside|land|limit|max_size/i.test(code)) return t('المكان أو التوسعة خارج حدود الأرض المتاحة.', 'This position or expansion exceeds the available land.')
  if (/version|conflict|stale/i.test(code)) return t('تغيّر هذا العنصر على جهاز آخر. حدّث المدينة وحاول مجددًا.', 'This object changed on another device. Refresh the city and try again.')
  if (/offline|network|fetch/i.test(code)) return t('أنت غير متصل. اتصل بالإنترنت لإتمام العملية بأمان.', 'You are offline. Reconnect to safely complete this action.')
  if (/ownership|owner|not_found|not_owned|permission/i.test(code)) return t('لم يعد هذا العنصر متاحًا لحسابك. حدّث بياناتك.', 'This item is no longer available to your account. Refresh your data.')
  return t('تعذّر إتمام العملية. بياناتك محفوظة؛ حاول مجددًا أو حدّث الصفحة.', 'The action could not be completed. Your saved data is safe; retry or refresh.')
}
