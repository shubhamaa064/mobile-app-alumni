/**
 * Thin typed client over the CTK Next.js backend, aligned with the official
 * Android API Reference. Public reads hit unauthenticated endpoints; the
 * `/api/auth/mobile-*` endpoints issue a 30-day JWT we store in SecureStore and
 * attach as a Bearer token on authenticated requests.
 */
import { Platform } from "react-native";
import * as Device from "expo-device";
import * as SecureStore from "expo-secure-store";

export const API_BASE = "https://alum-app-tau.vercel.app";

/** SecureStore key for the mobile JWT (per the documented reference client). */
const TOKEN_KEY = "auth.token";
let authToken: string | null = null;

/** Load the persisted token into memory (call once on launch). */
export async function loadToken(): Promise<string | null> {
  if (authToken) return authToken;
  try {
    authToken = await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    // SecureStore is native-only; on web there is no token.
  }
  return authToken;
}

/** Persist (or clear) the token both in memory and SecureStore. */
export async function setToken(token: string | null): Promise<void> {
  authToken = token;
  try {
    if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
    else await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // ignore on web / unavailable secure store
  }
}

export function getToken(): string | null {
  return authToken;
}

/** Device metadata the backend records against each session / push token. */
function device() {
  return {
    platform: Platform.OS,
    model: Device.modelName ?? undefined,
    version: Device.osVersion ?? undefined,
  };
}

/**
 * The backend now sends CORS headers (Access-Control-Allow-Origin), so every
 * platform — native and the Expo web dev preview — hits the API directly.
 */
function resolveUrl(path: string): string {
  return `${API_BASE}${path}`;
}

/**
 * Error carrying the HTTP status so callers can distinguish a real auth failure
 * (401 → drop the session) from a transient network/server problem (status 0 or
 * 5xx → keep the cached session, the user stays logged in).
 */
export class ApiError extends Error {
  status: number;
  fieldErrors?: Record<string, string>;
  constructor(message: string, status: number, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export type ListResponse<T> = { data: T[]; total: number; page: number; limit: number };

export type SiteInfo = { name: string | null; tagline: string | null; logoUrl: string | null };

export type HeroStat = { value: string; label: string; description?: string };
export type SiteContent = {
  hero?: {
    badge?: string;
    heading1?: string;
    heading2?: string;
    subheading?: string;
    stats?: HeroStat[];
    featuredEventTitle?: string;
    featuredEventDate?: string;
    featuredEventBadge?: string;
  };
  stats?: HeroStat[];
  features?: { badge?: string; heading?: string; description?: string; items?: { icon?: string; title?: string; description?: string }[] };
};

export type EventItem = {
  id: string;
  title: string;
  description: string;
  date: string;
  endDate: string | null;
  location: string | null;
  ticketPrice: number | null;
  maxAttendees: number | null;
  currentAttendees: number;
  status: string;
  category: string;
  isVirtual: boolean;
  imageUrl: string | null;
  organizer: string | null;
  registrationDeadline: string | null;
  tags: string | null;
  createdAt: string;
  _count?: { registrations: number };
};

export type NewsArticle = {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  authorAvatar: string | null;
  publishedAt: string;
  category: string;
  imageUrl: string | null;
  tags: string | null;
  featured: boolean;
  views: number;
};

export type GalleryItem = {
  id: string;
  albumId: string | null;
  title: string;
  description: string;
  type: string;
  url: string;
  thumbnail: string | null;
  category: string;
  views: number;
  likes: number;
  createdAt: string;
};

export type Album = {
  id: string;
  name: string;
  description: string;
  coverUrl: string | null;
  category: string;
  tags: string;
  isPublic?: boolean;
  requiresMembership?: boolean;
  createdAt: string;
  _count?: { photos: number };
};

export type Address = {
  street: string | null;
  landmark: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  country: string | null;
};

export type WorkExperience = {
  id: string;
  company: string;
  title: string;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  description: string | null;
};

export type Education = {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string | null;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
};

export type AlumniProfile = {
  id: string;
  firstName: string;
  lastName: string;
  batchYear: number | null;
  bio: string | null;
  skills: string | null;
  profession: string | null;
  company: string | null;
  country: string | null;
  imageUrl: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  websiteUrl: string | null;
  isVerified: boolean;
  mobile: string | null;
  whatsapp: string | null;
  dateOfBirth: string | null;
  fatherName?: string | null;
  motherName?: string | null;
  resumeUrl?: string | null;
  privacySettings?: string | null;
  sameAddress?: boolean;
  currentAddress?: Address | null;
  permanentAddress?: Address | null;
  workExperiences?: WorkExperience[];
  education?: Education[];
};

export type PrivacySettings = {
  showMobile: boolean;
  showWhatsapp: boolean;
  showEmail: boolean;
  showDateOfBirth: boolean;
  showCurrentAddress: boolean;
  showPermanentAddress: boolean;
  showEducation: boolean;
  showWorkExperience: boolean;
};

export const DEFAULT_PRIVACY: PrivacySettings = {
  showMobile: false,
  showWhatsapp: false,
  showEmail: false,
  showDateOfBirth: true,
  showCurrentAddress: true,
  showPermanentAddress: true,
  showEducation: true,
  showWorkExperience: true,
};

export function parsePrivacy(raw?: string | null): PrivacySettings {
  if (!raw) return { ...DEFAULT_PRIVACY };
  try {
    return { ...DEFAULT_PRIVACY, ...(JSON.parse(raw) as Partial<PrivacySettings>) };
  } catch {
    return { ...DEFAULT_PRIVACY };
  }
}

/** GET /api/profile — the signed-in user's full profile. */
export type MyProfile = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: string;
  status: string;
  alumniProfile: AlumniProfile | null;
};

/** Subset of fields accepted by PUT /api/profile. */
export type ProfileUpdate = Partial<{
  firstName: string;
  lastName: string;
  bio: string;
  profession: string;
  company: string;
  country: string;
  batchYear: number | null;
  dateOfBirth: string | null;
  mobile: string;
  whatsapp: string;
  skills: string;
  linkedinUrl: string;
  twitterUrl: string;
  websiteUrl: string;
  avatarUrl: string;
  resumeUrl: string;
  fatherName: string;
  motherName: string;
  sameAddress: boolean;
  currentAddress: Address;
  permanentAddress: Address;
  privacySettings: Partial<PrivacySettings>;
}>;

export type Completeness = {
  percent: number;
  completedKeys: string[];
  missing: { key: string; label: string; weight: number }[];
  topNudges: { key: string; label: string; weight: number; reaches: number }[];
};

export type Membership = {
  status: string;
  expiresAt: string | null;
  plan: { name: string };
};

export type AlumniUser = {
  id: string;
  email: string;
  role: string;
  status: string;
  membershipId: string | null;
  createdAt: string;
  alumniProfile: AlumniProfile | null;
  memberships?: Membership[];
};

export type JobPost = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  description: string;
  salaryRange: string | null;
  link: string | null;
  requirements: string | null;
  benefits: string | null;
  deadline: string | null;
  category: string;
  applicants: number;
  isActive: boolean;
  createdAt: string;
};

export type LeaderMember = {
  id: string;
  name: string;
  profileImage: string | null;
  bio: string | null;
  batchYear: number | null;
  email: string | null;
  phone: string | null;
  linkedinUrl: string | null;
  startYear: number | null;
  endYear: number | null;
  isCurrent: boolean;
  order: number;
};

/** A designation group from /api/leadership, e.g. "President", "Secretary". */
export type Leader = {
  id: string;
  name: string;
  description: string | null;
  order: number;
  isActive: boolean;
  members: LeaderMember[];
};

export type PrincipalTenure = {
  startYear: number | null;
  endYear: number | null;
  notes: string | null;
};

export type Principal = {
  id: string;
  name: string;
  bio: string | null;
  profileImage: string | null;
  order: number;
  tenures: PrincipalTenure[];
};

export type Birthday = {
  id: string;
  name: string;
  batch: number | null;
  profession: string | null;
  company: string | null;
  imageUrl: string | null;
  birthday: "today" | "this-week";
  dateOfBirth: string | null;
};

export type SurveyQuestion = {
  id: string;
  surveyId: string;
  prompt: string;
  type: string;
  options: string | null;
  required: boolean;
};

export type Survey = {
  id: string;
  title: string;
  description: string | null;
  isActive: boolean;
  isAnonymous: boolean;
  closesAt: string | null;
  questions: SurveyQuestion[];
};

export type MembershipPlan = {
  id: string;
  name: string;
  price: number;
  validity: number;
  description: string | null;
  maxAge: number | null;
  isLifetime: boolean;
  _count?: { memberships: number };
};

/** A row from GET /api/me/registrations (event registration + its event). */
export type EventRegistration = {
  id: string;
  eventId: string;
  status: string;
  amount: number;
  createdAt: string;
  event: {
    id: string;
    title: string;
    date: string;
    location: string | null;
    ticketPrice: number | null;
    imageUrl: string | null;
    status: string;
  };
};

/** A payment row from GET /api/me/payments. */
export type Payment = {
  id: string;
  amount: number;
  currency: string;
  type: string;
  status: string;
  paymentMethod: string | null;
  transactionId: string | null;
  paidFor: string | null;
  createdAt: string;
};

export type PaymentSummary = { type: string; _sum: { amount: number | null }; _count: number };

/** GET /api/me/membership response. */
export type MyMembership = {
  membership: (Membership & { plan: MembershipPlan }) | null;
  plans: MembershipPlan[];
  age: number | null;
  isExpired: boolean;
};

/** GET /api/dashboard/stats — admin/moderator overview. */
export type DashboardStats = {
  totalAlumni: number;
  totalEvents: number;
  upcomingEvents: number;
  totalJobs: number;
  totalDonations: number;
  recentMembers: { id: string; email: string; name: string; image: string | null; profession: string | null; company: string | null; country: string | null; joinedAt: string }[];
  memberGrowth: { month: string; count: number }[];
  eventAttendance: { event: string; attendees: number }[];
  batchDistribution: { batch: string; count: number }[];
  donationTrend: { month: string; amount: number }[];
  recentActivity: { id: string; type: string; message: string; time: string }[];
};

/** A payment row as returned by GET /api/admin/payments (includes the payer). */
export type AdminPayment = Payment & {
  user: {
    email: string;
    membershipId: string | null;
    alumniProfile: { firstName: string | null; lastName: string | null; mobile?: string | null } | null;
  } | null;
};

/** A row from GET /api/admin/audit-logs. */
export type AuditLog = {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: string | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
};

/** A fundraising campaign from GET /api/donations. */
export type DonationCampaign = {
  id: string;
  title: string;
  description: string;
  targetGoal: number;
  raised: number;
  startDate: string;
  endDate: string | null;
};

export type Role = "ALUMNI" | "MODERATOR" | "ADMIN";

/** Normalised user the app renders (firstName/lastName/imageUrl). */
export type AuthUser = {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
};

/** Raw user object returned by the documented mobile-auth endpoints. */
export type MobileSessionUser = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  status?: string;
  tenantId?: string;
  image?: string | null;
};

export type AuthSession = { token: string; expiresAt: string; user: AuthUser };

/** Split the backend's single `name` into first/last and map `image`. */
function normalizeUser(u: MobileSessionUser): AuthUser {
  const name = (u.name || "").trim();
  const parts = name ? name.split(/\s+/) : [];
  return {
    id: u.id,
    email: u.email,
    role: u.role,
    firstName: parts[0],
    lastName: parts.length > 1 ? parts.slice(1).join(" ") : undefined,
    imageUrl: u.image || undefined,
  };
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(resolveUrl(path), {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

/**
 * Core request helper used by the authenticated/mobile endpoints. Injects the
 * Bearer token when `auth` is set, surfaces `error`/`fieldErrors`, and clears a
 * stale token on 401 so the app can route back to Login.
 */
async function request<T>(
  path: string,
  init: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body) headers.set("Content-Type", "application/json");
  if (init.auth) {
    const t = await loadToken();
    if (t) headers.set("Authorization", `Bearer ${t}`);
  }
  let res: Response;
  try {
    res = await fetch(resolveUrl(path), { ...init, headers });
  } catch (e) {
    // Network failure (offline, DNS, timeout) — surface as status 0 so callers
    // can keep the session instead of treating it as an auth failure.
    throw new ApiError((e as Error)?.message || "Network request failed", 0);
  }
  const text = await res.text();
  const body = text ? (() => { try { return JSON.parse(text); } catch { return null; } })() : null;
  if (!res.ok) {
    if (res.status === 401) await setToken(null);
    const err = body as { error?: string; fieldErrors?: Record<string, string> } | null;
    const firstField = err?.fieldErrors ? Object.values(err.fieldErrors)[0] : undefined;
    throw new ApiError(firstField || err?.error || `Request failed (${res.status})`, res.status, err?.fieldErrors);
  }
  return body as T;
}

function qs(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== "");
  if (!entries.length) return "";
  return "?" + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join("&");
}

export const api = {
  siteInfo: () => get<SiteInfo>("/api/site/info"),
  siteContent: () => get<SiteContent>("/api/site/content"),

  events: (p: { status?: string; category?: string; search?: string; page?: number; limit?: number } = {}) =>
    get<ListResponse<EventItem>>(`/api/events${qs(p)}`),
  event: (id: string) => get<EventItem>(`/api/events/${id}`),

  news: (p: { category?: string; featured?: string; search?: string; page?: number; limit?: number } = {}) =>
    get<ListResponse<NewsArticle>>(`/api/news${qs(p)}`),
  newsItem: (id: string) => get<NewsArticle>(`/api/news/${id}`),

  gallery: (p: { albumId?: string; category?: string; type?: string; page?: number; limit?: number } = {}) =>
    get<ListResponse<GalleryItem>>(`/api/gallery${qs(p)}`),
  albums: (p: { page?: number; limit?: number } = {}) => get<ListResponse<Album>>(`/api/albums${qs(p)}`),

  alumni: (
    p: { search?: string; batch?: string; country?: string; profession?: string; status?: string; page?: number; limit?: number } = {}
  ) => get<ListResponse<AlumniUser>>(`/api/alumni${qs(p)}`),
  // Authenticated so signed-in members see fields the owner's privacy
  // settings permit (the server masks contact details for anonymous viewers).
  alumnus: (id: string) => request<AlumniUser>(`/api/alumni/${id}`, { auth: true }),

  jobs: (p: { search?: string; page?: number; limit?: number } = {}) =>
    get<ListResponse<JobPost>>(`/api/jobs${qs(p)}`),
  jobItem: (id: string) => get<JobPost>(`/api/jobs/${id}`),

  leadership: () => get<{ data: Leader[] }>("/api/leadership"),
  principals: () => get<Principal[]>("/api/principals"),
  membershipPlans: () => get<{ data: MembershipPlan[] }>("/api/membership/plans"),

  birthdays: () => get<Birthday[]>("/api/alumni/birthdays"),
  surveys: () => get<{ data: Survey[] }>("/api/surveys"),

  // Authenticated "me" endpoints.
  myProfile: () => request<MyProfile>("/api/profile", { auth: true }),
  profileCompleteness: () => request<Completeness>("/api/profile/completeness", { auth: true }),
  myRegistrations: () => request<EventRegistration[]>("/api/me/registrations", { auth: true }),
  myMembership: () => request<MyMembership>("/api/me/membership", { auth: true }),
  myPayments: (p: { page?: number; limit?: number } = {}) =>
    request<ListResponse<Payment> & { summary: PaymentSummary[] }>(`/api/me/payments${qs(p)}`, { auth: true }),
  myLanguage: () => request<{ language: string }>("/api/me/language", { auth: true }),

  // Admin / moderator.
  dashboardStats: () => request<DashboardStats>("/api/dashboard/stats", { auth: true }),

  // Admin management reads.
  adminMembers: (
    p: { search?: string; batch?: string; status?: string; page?: number; limit?: number } = {}
  ) => request<ListResponse<AlumniUser>>(`/api/alumni${qs(p)}`, { auth: true }),
  adminEvents: (p: { status?: string; search?: string; page?: number; limit?: number } = {}) =>
    request<ListResponse<EventItem>>(`/api/events${qs(p)}`, { auth: true }),
  adminNews: (p: { search?: string; page?: number; limit?: number } = {}) =>
    request<ListResponse<NewsArticle>>(`/api/news${qs(p)}`, { auth: true }),
  adminJobs: (p: { search?: string; page?: number; limit?: number } = {}) =>
    request<ListResponse<JobPost>>(`/api/jobs${qs(p)}`, { auth: true }),
  adminPayments: (p: { type?: string; status?: string; search?: string; page?: number; limit?: number } = {}) =>
    request<ListResponse<AdminPayment> & { summary: PaymentSummary[]; totalRevenue: number; totalCount: number }>(
      `/api/admin/payments${qs(p)}`,
      { auth: true }
    ),
  donationCampaigns: () => request<{ data: DonationCampaign[] }>("/api/donations", { auth: true }),
  auditLogs: (p: { action?: string; page?: number; limit?: number } = {}) =>
    request<ListResponse<AuditLog>>(`/api/admin/audit-logs${qs(p)}`, { auth: true }),
  siteSettings: () => request<{ settings: Record<string, unknown> }>("/api/admin/settings", { auth: true }),
};

/** Fields accepted by event create/update (POST/PUT /api/events). */
export type EventInput = Partial<{
  title: string;
  description: string;
  date: string;
  endDate: string | null;
  location: string;
  category: string;
  status: string;
  ticketPrice: number | null;
  isPaid: boolean;
  maxAttendees: number | null;
  isVirtual: boolean;
  imageUrl: string;
  organizer: string;
  registrationDeadline: string | null;
  tags: string;
}>;

/** Fields accepted by news create/update (POST/PUT /api/news). */
export type NewsInput = Partial<{
  title: string;
  excerpt: string;
  content: string;
  author: string;
  category: string;
  imageUrl: string;
  tags: string;
  featured: boolean;
  publishedAt: string;
}>;

/** Fields accepted by job create/update (POST/PUT /api/jobs). */
export type JobInput = Partial<{
  title: string;
  company: string;
  location: string;
  type: string;
  category: string;
  description: string;
  salaryRange: string;
  link: string;
  requirements: string;
  benefits: string;
  deadline: string | null;
  isActive: boolean;
}>;

/** Fields accepted by PUT /api/alumni/[id] when an admin edits a member. */
export type MemberUpdate = Partial<{
  firstName: string;
  lastName: string;
  batchYear: number | null;
  profession: string;
  company: string;
  country: string;
  isVerified: boolean;
  status: string;
  role: Role;
  assignMembershipId: boolean;
}>;

// ── Admin mutations ──────────────────────────────────────────────────────────

export const createEvent = (body: EventInput) =>
  request<EventItem>("/api/events", { method: "POST", auth: true, body: JSON.stringify(body) });
export const updateEvent = (id: string, body: EventInput) =>
  request<EventItem>(`/api/events/${id}`, { method: "PUT", auth: true, body: JSON.stringify(body) });
export const deleteEvent = (id: string) =>
  request<{ success: boolean }>(`/api/events/${id}`, { method: "DELETE", auth: true });

export const createNews = (body: NewsInput) =>
  request<NewsArticle>("/api/news", { method: "POST", auth: true, body: JSON.stringify(body) });
export const updateNews = (id: string, body: NewsInput) =>
  request<NewsArticle>(`/api/news/${id}`, { method: "PUT", auth: true, body: JSON.stringify(body) });
export const deleteNews = (id: string) =>
  request<{ success: boolean }>(`/api/news/${id}`, { method: "DELETE", auth: true });

export const createJob = (body: JobInput) =>
  request<JobPost>("/api/jobs", { method: "POST", auth: true, body: JSON.stringify(body) });
export const updateJob = (id: string, body: JobInput) =>
  request<JobPost>(`/api/jobs/${id}`, { method: "PUT", auth: true, body: JSON.stringify(body) });
export const deleteJob = (id: string) =>
  request<{ success: boolean }>(`/api/jobs/${id}`, { method: "DELETE", auth: true });

export const updateMember = (id: string, body: MemberUpdate) =>
  request<AlumniUser>(`/api/alumni/${id}`, { method: "PUT", auth: true, body: JSON.stringify(body) });
export const deleteMember = (id: string) =>
  request<{ success: boolean }>(`/api/alumni/${id}`, { method: "DELETE", auth: true });

export const deleteGalleryItem = (id: string) =>
  request<{ success: boolean }>(`/api/gallery/${id}`, { method: "DELETE", auth: true });
export const createGalleryItem = (body: {
  title: string;
  type: string;
  url: string;
  description?: string;
  category?: string;
  thumbnail?: string;
  albumId?: string;
  isPublic?: boolean;
}) => request<GalleryItem>("/api/gallery", { method: "POST", auth: true, body: JSON.stringify(body) });

/**
 * POST /api/upload — multipart upload of a local file (image/pdf/video).
 * Returns the stored absolute (or app-relative) URL the backend persists.
 */
export async function uploadFile(file: { uri: string; name: string; type: string }): Promise<{ url: string }> {
  const t = await loadToken();
  const form = new FormData();
  // React Native's FormData accepts a { uri, name, type } file descriptor.
  form.append("file", { uri: file.uri, name: file.name, type: file.type } as unknown as Blob);
  const res = await fetch(resolveUrl("/api/upload"), {
    method: "POST",
    headers: { Accept: "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}) },
    body: form,
  });
  const text = await res.text();
  const body = text ? (() => { try { return JSON.parse(text); } catch { return null; } })() : null;
  if (!res.ok) {
    if (res.status === 401) await setToken(null);
    throw new Error((body as { error?: string })?.error || `Upload failed (${res.status})`);
  }
  return body as { url: string };
}

export const createAlbum = (body: {
  name: string;
  description?: string;
  coverUrl?: string;
  isPublic?: boolean;
  requiresMembership?: boolean;
  category?: string;
  tags?: string;
}) => request<Album>("/api/albums", { method: "POST", auth: true, body: JSON.stringify(body) });
export const deleteAlbum = (id: string) =>
  request<{ success: boolean }>(`/api/albums/${id}`, { method: "DELETE", auth: true });

/** POST /api/push/send — admin-only broadcast to every push subscriber. */
export const sendPushBroadcast = (body: { title: string; body?: string; url?: string }) =>
  request<{ sent: number; failed: number; total?: number; message?: string }>("/api/push/send", {
    method: "POST",
    auth: true,
    body: JSON.stringify(body),
  });
/** GET /api/push/send — current subscriber count (admin only). */
export const pushSubscriberCount = () =>
  request<{ subscribers: number }>("/api/push/send", { auth: true });

export type SurveyQuestionInput = { prompt: string; type: string; options?: string[]; required?: boolean };
export const createSurvey = (body: {
  title: string;
  description?: string;
  isAnonymous?: boolean;
  closesAt?: string;
  questions: SurveyQuestionInput[];
}) => request<Survey>("/api/surveys", { method: "POST", auth: true, body: JSON.stringify(body) });

export const createDesignation = (body: { name: string; description?: string; order?: number }) =>
  request<Leader>("/api/leadership", { method: "POST", auth: true, body: JSON.stringify(body) });
export const deleteDesignation = (id: string) =>
  request<{ success: boolean }>(`/api/leadership/${id}`, { method: "DELETE", auth: true });
export const createLeader = (body: {
  designationId: string;
  name: string;
  bio?: string;
  batchYear?: number;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  startYear?: number;
  endYear?: number;
  isCurrent?: boolean;
  profileImage?: string;
}) => request<LeaderMember>("/api/leadership/members", { method: "POST", auth: true, body: JSON.stringify(body) });
export const deleteLeader = (id: string) =>
  request<{ success: boolean }>(`/api/leadership/members/${id}`, { method: "DELETE", auth: true });

export const createPrincipal = (body: {
  name: string;
  bio?: string;
  profileImage?: string;
  order?: number;
  tenures?: { startYear: number; endYear?: number; notes?: string }[];
}) => request<Principal>("/api/principals", { method: "POST", auth: true, body: JSON.stringify(body) });
export const deletePrincipal = (id: string) =>
  request<{ success: boolean }>(`/api/principals/${id}`, { method: "DELETE", auth: true });

export const createPayment = (body: {
  amount: number;
  type: string;
  userId?: string;
  currency?: string;
  status?: string;
  paymentMethod?: string;
  transactionId?: string;
  paidFor?: string;
  notes?: string;
}) => request<AdminPayment>("/api/admin/payments", { method: "POST", auth: true, body: JSON.stringify(body) });

export const updateSettings = (section: string, data: Record<string, unknown>) =>
  request<{ success: boolean; section: string }>("/api/admin/settings", {
    method: "PUT",
    auth: true,
    body: JSON.stringify({ section, data }),
  });

/** Absolute URL for an event's downloadable .ics calendar file. */
export function eventIcsUrl(id: string): string {
  return `${API_BASE}/api/events/${id}/ics`;
}

/** POST /api/events/[id]/register — register the signed-in user for an event. */
export async function registerEvent(
  id: string,
  body: { paymentMethod?: string; transactionId?: string; formData?: Record<string, unknown> } = {},
): Promise<{ success: boolean }> {
  return request(`/api/events/${id}/register`, { method: "POST", auth: true, body: JSON.stringify(body) });
}

/** DELETE /api/events/[id]/register — cancel the signed-in user's registration. */
export async function unregisterEvent(id: string): Promise<{ success: boolean }> {
  return request(`/api/events/${id}/register`, { method: "DELETE", auth: true });
}

/** POST /api/surveys/[id]/respond — submit answers keyed by question id. */
export async function respondSurvey(id: string, answers: Record<string, unknown>): Promise<{ id: string }> {
  return request(`/api/surveys/${id}/respond`, { method: "POST", auth: true, body: JSON.stringify({ answers }) });
}

/** POST /api/membership/subscribe — purchase / renew a membership plan. */
export async function subscribeMembership(
  planId: string,
  extra: { paymentMethod?: string; transactionId?: string; notes?: string } = {},
): Promise<{ success: boolean }> {
  return request("/api/membership/subscribe", { method: "POST", auth: true, body: JSON.stringify({ planId, ...extra }) });
}

/** PUT /api/me/language — set the member's preferred locale (en|hi|ml). */
export async function setLanguage(language: string): Promise<{ success: boolean; language: string }> {
  return request("/api/me/language", { method: "PUT", auth: true, body: JSON.stringify({ language }) });
}

/** PUT /api/profile — update any subset of the signed-in user's fields. */
export async function updateProfile(payload: ProfileUpdate): Promise<{ success?: boolean; message?: string }> {
  return request("/api/profile", { method: "PUT", auth: true, body: JSON.stringify(payload) });
}

/** PUT /api/profile with password fields — change the account password. */
export async function changePassword(currentPassword: string, newPassword: string): Promise<{ success?: boolean; message?: string }> {
  return request("/api/profile", { method: "PUT", auth: true, body: JSON.stringify({ currentPassword, newPassword }) });
}

/** POST /api/auth/forgot-password — always 200 to prevent enumeration. */
export async function forgotPassword(email: string): Promise<{ message: string; maskedEmail?: string }> {
  return request("/api/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
}

/** POST /api/auth/reset-password — complete a reset with the emailed token. */
export async function resetPassword(token: string, newPassword: string): Promise<{ success: boolean }> {
  return request("/api/auth/reset-password", { method: "POST", body: JSON.stringify({ token, newPassword }) });
}

export async function contact(data: {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  category?: string;
  message: string;
}): Promise<{ ok: true }> {
  const res = await fetch(`${API_BASE}/api/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = body as { error?: string; fieldErrors?: Record<string, string> };
    const firstField = err.fieldErrors ? Object.values(err.fieldErrors)[0] : undefined;
    throw new Error(firstField || err.error || "Could not send your message");
  }
  return { ok: true };
}

type RawSession = { token: string; expiresAt: string; user: MobileSessionUser };

/** POST /api/auth/mobile-login — email + password → 30-day session. */
export async function login(email: string, password: string): Promise<AuthSession> {
  const s = await request<RawSession>("/api/auth/mobile-login", {
    method: "POST",
    body: JSON.stringify({ email, password, device: device() }),
  });
  await setToken(s.token);
  return { token: s.token, expiresAt: s.expiresAt, user: normalizeUser(s.user) };
}

/** POST /api/auth/mobile-register — creates the account and returns a session. */
export async function register(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  batchYear?: number;
  profession?: string;
  company?: string;
  country?: string;
}): Promise<AuthSession> {
  const s = await request<RawSession>("/api/auth/mobile-register", {
    method: "POST",
    body: JSON.stringify({ ...data, device: device() }),
  });
  await setToken(s.token);
  return { token: s.token, expiresAt: s.expiresAt, user: normalizeUser(s.user) };
}

/**
 * Result of validating the stored token. `ok` carries the user; otherwise
 * `reason` says whether it was a genuine auth failure (drop session) or a
 * transient network/server hiccup (keep the cached session).
 */
export type MeResult =
  | { ok: true; user: AuthUser }
  | { ok: false; reason: "unauthorized" | "network" };

/** GET /api/auth/mobile-me — validate the stored token on launch. */
export async function mobileMe(): Promise<MeResult> {
  try {
    const r = await request<{ user: MobileSessionUser }>("/api/auth/mobile-me", { auth: true });
    return { ok: true, user: normalizeUser(r.user) };
  } catch (e) {
    // Only a real 401/403 means the token is invalid. Network errors (status 0)
    // and server errors (5xx) must NOT log the user out.
    const status = e instanceof ApiError ? e.status : 0;
    const reason = status === 401 || status === 403 ? "unauthorized" : "network";
    return { ok: false, reason };
  }
}

// ── Passwordless OTP login ───────────────────────────────────────────────────

export type OtpRequestResult = {
  ok: boolean;
  channel: "sms" | "email";
  maskedTarget: string;
  expiresAt: string;
  delivered: boolean;
  masterAvailable: boolean;
};

/**
 * POST /api/auth/otp/request — send a login code to a registered mobile number
 * or email. Members-only: throws ApiError(404) if the identifier isn't known.
 */
export async function otpRequest(identifier: string): Promise<OtpRequestResult> {
  return request<OtpRequestResult>("/api/auth/otp/request", {
    method: "POST",
    body: JSON.stringify({ identifier, purpose: "login" }),
  });
}

/**
 * POST /api/auth/otp/verify — exchange a valid code for a 30-day session.
 * Persists the token (same shape as email/password login).
 */
export async function otpVerify(identifier: string, code: string): Promise<AuthSession> {
  const s = await request<RawSession>("/api/auth/otp/verify", {
    method: "POST",
    body: JSON.stringify({ identifier, code, device: device() }),
  });
  await setToken(s.token);
  return { token: s.token, expiresAt: s.expiresAt, user: normalizeUser(s.user) };
}

/** POST /api/auth/mobile-refresh — swap a valid token for a fresh 30-day one. */
export async function mobileRefresh(): Promise<AuthSession | null> {
  try {
    const s = await request<RawSession>("/api/auth/mobile-refresh", { method: "POST", auth: true });
    await setToken(s.token);
    return { token: s.token, expiresAt: s.expiresAt, user: normalizeUser(s.user) };
  } catch {
    return null;
  }
}

/** POST /api/auth/mobile-logout — best-effort audit log, then clear the token. */
export async function mobileLogout(): Promise<void> {
  await request("/api/auth/mobile-logout", { method: "POST", auth: true }).catch(() => {});
  await setToken(null);
}

/** POST /api/push/subscribe — register an Expo/FCM push token (auth required). */
export async function subscribePush(token: string, deviceId: string): Promise<void> {
  await request("/api/push/subscribe", {
    method: "POST",
    auth: true,
    body: JSON.stringify({ token, platform: Platform.OS, deviceId }),
  }).catch(() => {});
}

/** DELETE /api/push/subscribe — unregister a push token (auth required). */
export async function unsubscribePush(token: string): Promise<void> {
  await request("/api/push/subscribe", {
    method: "DELETE",
    auth: true,
    body: JSON.stringify({ token }),
  }).catch(() => {});
}
