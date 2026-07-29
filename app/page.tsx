'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import { fetchPublicProperties, shortMoney, listingTag, cacheProperty, Property } from '../lib/api';

const PER_PAGE = 12;
const HOME_STATE_KEY = 'crmdost:home-state:v1';

type HomeState = {
	items: Property[];
	total: number;
	page: number;
	search: string;
	type: string;
	listing: string;
	companyFilter: string;
};

let memoryHomeState: HomeState | null = null;
let inFlightHomeFetchKey: string | null = null;
let inFlightHomeFetchPromise: Promise<{ items: Property[]; total: number }> | null = null;

const fetchHomeWithDedupe = async (page: number, search: string, type: string) => {
	const key = `${page}|${search}|${type}`;

	if (inFlightHomeFetchPromise && inFlightHomeFetchKey === key) {
		return inFlightHomeFetchPromise;
	}

	inFlightHomeFetchKey = key;
	inFlightHomeFetchPromise = fetchPublicProperties({ page, perPage: PER_PAGE, search, type });

	try {
		return await inFlightHomeFetchPromise;
	} finally {
		if (inFlightHomeFetchKey === key) {
			inFlightHomeFetchKey = null;
			inFlightHomeFetchPromise = null;
		}
	}
};

const readCachedHomeState = (): HomeState | null => {
	if (typeof window === 'undefined') return null;

	try {
		const raw = sessionStorage.getItem(HOME_STATE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as HomeState;
		if (!Array.isArray(parsed?.items)) return null;
		return parsed;
	} catch {
		return null;
	}
};

const writeCachedHomeState = (value: HomeState): void => {
	if (typeof window === 'undefined') return;
	try {
		sessionStorage.setItem(HOME_STATE_KEY, JSON.stringify(value));
	} catch {
		// Ignore storage failures to keep UI responsive.
	}
};

function StatIcons({ p }: { p: Property }) {
	return (
		<div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8, paddingTop: 9, borderTop: '1px solid #F4F1EC', fontSize: 12, color: '#5A5048' }}>
			<span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
				<svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#B8B4AE" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6" /><path d="M3 11V8a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3" /><path d="M3 18h18M21 18v-3" /></svg>
				{p.beds || '—'} Beds
			</span>
			<span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
				<svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#B8B4AE" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M9 6V4a2 2 0 0 1 4 0v2" /><path d="M4 11h16v3a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-3Z" /><path d="M6 19v1M14 19v1" /></svg>
				{p.baths || '—'} Baths
			</span>
			<span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
				<svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#B8B4AE" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" /></svg>
				{p.area ? p.area + ' sq ft' : '—'}
			</span>
		</div>
	);
}

export default function HomePage() {
	const cachedHomeState = memoryHomeState || readCachedHomeState();
	const router = useRouter();
	const [items, setItems] = useState<Property[]>(cachedHomeState?.items || []);
	const [total, setTotal] = useState(cachedHomeState?.total || 0);
	const [page, setPage] = useState(cachedHomeState?.page || 1);
	const [search, setSearch] = useState(cachedHomeState?.search || '');
	const [type, setType] = useState(cachedHomeState?.type || 'any');
	const [listing, setListing] = useState(cachedHomeState?.listing || 'any');
	const [companyFilter, setCompanyFilter] = useState(cachedHomeState?.companyFilter || 'any');
	const [loading, setLoading] = useState((cachedHomeState?.items?.length || 0) === 0);
	const [error, setError] = useState('');
	const hasMountedRef = useRef(false);
	const itemsCountRef = useRef((cachedHomeState?.items?.length || 0));

	useEffect(() => {
		itemsCountRef.current = items.length;
	}, [items]);

	const load = useCallback(async (p: number, s: string, t: string) => {
		const shouldShowLoading = itemsCountRef.current === 0;
		if (shouldShowLoading) setLoading(true);
		setError('');

		try {
			const { items, total } = await fetchHomeWithDedupe(p, s, t);
			const nextHomeState: HomeState = {
				items,
				total,
				page: p,
				search: s,
				type: t,
				listing,
				companyFilter
			};

			setItems(items);
			setTotal(total);
			items.forEach(cacheProperty);
			memoryHomeState = nextHomeState;
			writeCachedHomeState(nextHomeState);
		} catch (e: any) {
			setError(e.message || 'Could not load properties');
		} finally {
			setLoading(false);
		}
	}, [listing, companyFilter]);

	useEffect(() => { load(page, search, type); }, [page]); // eslint-disable-line
	useEffect(() => {
		if (!hasMountedRef.current) {
			hasMountedRef.current = true;
			return;
		}

		const t = setTimeout(() => {
			if (page === 1) {
				load(1, search, type);
				return;
			}
			setPage(1);
		}, 350);

		return () => clearTimeout(t);
	}, [search, type]); // eslint-disable-line

	const filtered = items.filter(p => {
		const lt = listingTag(p.id);
		if (listing !== 'any' && (listing === 'rent') !== lt.isRent) return false;
		if (companyFilter !== 'any' && p.companyId !== companyFilter) return false;
		return true;
	});
	const companyOptions = Array.from(new Map(items.map(p => [p.companyId, p.companyName || ('Company ' + p.companyId)])).entries());
	const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

	let pageNums: (number | 'ellipsis')[] = [];
	if (totalPages <= 7) pageNums = Array.from({ length: totalPages }, (_, i) => i + 1);
	else {
		const nums = new Set([1, 2, totalPages - 1, totalPages, page - 1, page, page + 1].filter(n => n >= 1 && n <= totalPages));
		const sorted = [...nums].sort((a, b) => a - b);
		let prev = 0;
		sorted.forEach(n => { if (prev && n - prev > 1) pageNums.push('ellipsis'); pageNums.push(n); prev = n; });
	}

	const openDetail = (p: Property) => { cacheProperty(p); router.push(`/properties/${p.id}`); };

	return (
		<div style={{ minHeight: '100vh', background: '#FAFAF8' }}>
			<Header />
			<div style={{ maxWidth: 1180, margin: '0 auto', padding: '32px 28px 70px', animation: 'pf-fade .2s ease' }}>
				<div style={{ marginBottom: 22 }}>
					<div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', color: '#E8650A', marginBottom: 6 }}>BROWSE ALL LISTINGS</div>
					<h1 style={{ fontSize: 24, fontWeight: 800, color: '#0A0604', letterSpacing: '-.01em' }}>Properties across CRM Dost</h1>
					<div style={{ fontSize: 13, color: '#8A8480', marginTop: 3 }}>{total} propert{total === 1 ? 'y' : 'ies'}</div>
				</div>

				<div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
					<div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #E8E4DE', borderRadius: 11, padding: '10px 14px', minWidth: 220, flex: '2 1 240px' }}>
						<svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#B8B4AE" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx={11} cy={11} r={7} /><path d="M21 21l-4-4" /></svg>
						<input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by property, society or company" style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 13.5, color: '#0A0604' }} />
					</div>
					<select value={type} onChange={e => setType(e.target.value)} style={{ border: '1px solid #E8E4DE', borderRadius: 11, padding: '10px 12px', fontSize: 13, color: '#3A3530', background: '#fff', cursor: 'pointer' }}>
						<option value="any">Any type</option><option value="Residential">Residential</option><option value="Commercial">Commercial</option>
					</select>
					<select value={listing} onChange={e => setListing(e.target.value)} style={{ border: '1px solid #E8E4DE', borderRadius: 11, padding: '10px 12px', fontSize: 13, color: '#3A3530', background: '#fff', cursor: 'pointer' }}>
						<option value="any">Buy or Rent</option><option value="sale">For Sale</option><option value="rent">For Rent</option>
					</select>
					<select value={companyFilter} onChange={e => setCompanyFilter(e.target.value)} style={{ border: '1px solid #E8E4DE', borderRadius: 11, padding: '10px 12px', fontSize: 13, color: '#3A3530', background: '#fff', cursor: 'pointer' }}>
						<option value="any">Any company</option>
						{companyOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
					</select>
				</div>

				{loading && <div style={{ textAlign: 'center', padding: '60px 0', color: '#8A8480', fontSize: 13.5 }}>Loading properties…</div>}
				{!loading && error && (
					<div style={{ textAlign: 'center', padding: '50px 20px', background: '#FCEBEB', border: '1px solid #F1C9C9', borderRadius: 18, color: '#A32D2D', fontSize: 13.5 }}>{error}</div>
				)}
				{!loading && !error && filtered.length === 0 && (
					<div style={{ textAlign: 'center', padding: '70px 20px', background: '#fff', border: '1px dashed #E0DCD5', borderRadius: 18 }}>
						<div style={{ fontSize: 16, fontWeight: 700, color: '#0A0604' }}>No listings match</div>
						<div style={{ fontSize: 13, color: '#8A8480', marginTop: 4 }}>Try a different search or filter.</div>
					</div>
				)}
				{!loading && !error && filtered.length > 0 && (
					<>
						<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: 18, marginBottom: 26 }}>
							{filtered.map(p => {
								const lt = listingTag(p.id);
								return (
									<div key={p.id} onClick={() => openDetail(p)} style={{ background: '#fff', border: '1px solid #EAE6E0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,.05)', cursor: 'pointer' }}>
										<div style={{ position: 'relative', height: 160, background: p.images[0] ? `url(${p.images[0]}) center/cover` : '#F0EDE8' }}>
											<span style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(10,6,4,.6)', color: '#fff', fontSize: 10.5, fontWeight: 700, borderRadius: 20, padding: '4px 10px' }}>{p.companyName || '—'}</span>
											<span style={{ position: 'absolute', top: 10, right: 10, background: lt.isRent ? '#E6F1FB' : '#EAF3DE', color: lt.isRent ? '#185FA5' : '#3B6D11', fontSize: 10.5, fontWeight: 700, borderRadius: 20, padding: '4px 10px' }}>{lt.tag}</span>
										</div>
										<div style={{ padding: 15 }}>
											<div style={{ fontSize: 15, fontWeight: 700, color: '#0A0604' }}>{p.name}</div>
											<div style={{ fontSize: 12, color: '#8A8480', marginTop: 3 }}>{[p.society, p.sector && `Sector ${p.sector}`].filter(Boolean).join(' · ') || p.addr1 || '—'}</div>
											<div style={{ fontSize: 17, fontWeight: 800, color: '#E8650A', marginTop: 8 }}>{shortMoney(p.price)}{lt.isRent ? '/mo' : ''}</div>
											<StatIcons p={p} />
										</div>
									</div>
								);
							})}
						</div>
						<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
							<button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ width: 34, height: 34, borderRadius: 9, background: '#fff', border: '1px solid #E8E4DE', color: '#5A5048', cursor: 'pointer', opacity: page === 1 ? 0.4 : 1 }}>‹</button>
							{pageNums.map((n, i) => n === 'ellipsis' ? (
								<span key={'e' + i} style={{ minWidth: 34, textAlign: 'center', color: '#B8B4AE' }}>…</span>
							) : (
								<button key={n} onClick={() => setPage(n as number)} style={{ minWidth: 34, height: 34, borderRadius: 9, background: n === page ? '#E8650A' : '#fff', border: `1px solid ${n === page ? '#E8650A' : '#E8E4DE'}`, color: n === page ? '#fff' : '#5A5048', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{n}</button>
							))}
							<button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ width: 34, height: 34, borderRadius: 9, background: '#fff', border: '1px solid #E8E4DE', color: '#5A5048', cursor: 'pointer', opacity: page === totalPages ? 0.4 : 1 }}>›</button>
						</div>
						<div style={{ textAlign: 'center', fontSize: 12, color: '#B8B4AE', marginTop: 10 }}>Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, total)} of {total}</div>
					</>
				)}
			</div>
			<div style={{ textAlign: 'center', padding: 24, color: '#B8B4AE', fontSize: 12, borderTop: '1px solid #F0EDE8' }}>Powered by CRM Dost</div>
		</div>
	);
}
