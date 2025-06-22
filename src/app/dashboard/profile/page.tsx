//src/app/dashboard/profile/page.tsx
'use client';
import { useState, useEffect, ChangeEvent } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import {
  UserCircleIcon, CalendarDateRangeIcon, MapPinIcon,
  PhotoIcon, DocumentTextIcon,
  InformationCircleIcon,
  PhoneArrowDownLeftIcon,
  IdentificationIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';

type ProviderDocs = {
  license_url?: string;
  insurance_url?: string;
  additional_image_urls?: string[];
  bike_model?: string;
  plate_number?: string;
};

export default function ProfilePage() {
  const { user } = useAuth();
  // Basic info
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [address, setAddress] = useState('');
  // Avatar
  const [avatarPreview, setAvatarPreview] = useState('');
  // Docs
  const [docs, setDocs] = useState<ProviderDocs>({});
  // New uploads state for provider docs
  const [newLicense, setNewLicense] = useState<File | null>(null);
  const [newInsurance, setNewInsurance] = useState<File | null>(null);
  const [newImages, setNewImages] = useState<File[]>([]);
  // Feedback
  const [msg, setMsg] = useState<string>('');

  // Load initial data
  useEffect(() => {
    api.get('/api/me').then(({ data }) => {
      setName(data.name);
      setPhone(data.phone);
      setDob(data.dob || '');
      setBloodGroup(data.blood_group || '');
      setAddress(data.address || '');
      if (data.avatar_url) setAvatarPreview(data.avatar_url);
    });
    if (user?.is_provider) {
      api.get(`/api/providers/${user.id}`)
        .then(({ data }) => setDocs(data))
        .catch(() => setDocs({}));
    }
  }, [user]);

  // Helper to show messages temporarily
  function flash(msg: string) {
    setMsg(msg);
    setTimeout(() => setMsg(''), 3000);
  }

  // Save basic info on blur
  async function saveField(field: string, value: string | number) {
    try {
      await api.patch('/api/me', { [field]: value });
      flash('Profile updated');
    } catch {
      flash('Failed to update');
    }
  }

  //Upload avatar immediately
  async function onAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    const form = new FormData();
    form.append('avatar', file);
    try {
      await api.patch('/api/me', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      flash('Avatar updated');
    } catch {
      flash('Avatar upload failed');
    }
  }

  //Upload a single doc
  async function uploadDoc(name: 'license' | 'insurance' | 'images', file: File | File[]) {
    if (!user) return;
    const form = new FormData();
    if (name === 'images' && Array.isArray(file)) {
      file.forEach((f, i) => form.append(`images[${i}]`, f));
    } else if (file instanceof File) {
      form.append(name, file);
    }
    try {
      await api.post(`/api/providers/${user.id}/docs`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      const { data } = await api.get(`/api/providers/${user.id}`);
      setDocs(data);
      flash('Document uploaded');
    } catch {
      flash('Upload failed');
    }
  }

  const bloodGroups = ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−'];

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-6">
      <h1 className="text-2xl font-bold">Your Profile</h1>
      {msg && <p className="text-green-600">{msg}</p>}

      {/* Avatar */}
      <div className="relative w-24 h-24">
        <div className="w-24 h-24 rounded-full overflow-hidden border border-gray-300 flex items-center justify-center bg-white">
          {avatarPreview ? (
            <Image
              src={avatarPreview}
              alt="Avatar"
              className="w-full h-full object-cover"
              width={96}
              height={96}
            />
          ) : (
            <UserCircleIcon className="w-20 h-20 text-gray-300" />
          )}
        </div>

        {/* Pencil Icon positioned at bottom-right */}
        <label className="absolute bottom-0 right-0 bg-white border border-gray-300 rounded-full p-1 cursor-pointer shadow hover:bg-gray-100 transition">
          <PencilSquareIcon className="w-5 h-5 text-gray-700" />
          <input type="file" accept="image/*" onChange={onAvatarChange} className="hidden" />
        </label>
      </div>

      {/* Basic Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name */}
        <div>
          <label className="flex items-center gap-2">
            <IdentificationIcon className="w-5 h-5" /> Name
          </label>
          <input
            className="w-full border px-2 py-1 rounded"
            value={name}
            onChange={e => setName(e.target.value)}
            onBlur={() => saveField('name', name)}
          />
        </div>
        {/* Phone */}
        <div>
          <label className="flex items-center gap-2">
            <PhoneArrowDownLeftIcon className="w-5 h-5" /> Phone
          </label>
          <input
            className="w-full border px-2 py-1 rounded"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            onBlur={() => saveField('phone', phone)}
          />
        </div>
        {/* DOB */}
        <div>
          <label className="flex items-center gap-2">
            <CalendarDateRangeIcon className="w-5 h-5" /> DOB
          </label>
          <input
            type="date"
            className="w-full border px-2 py-1 rounded"
            value={dob}
            onChange={e => setDob(e.target.value)}
            onBlur={() => saveField('dob', dob)}
          />
        </div>
        {/* Blood */}
        <div>
          <label className="flex items-center gap-2">
            <span className="flex items-center gap-1 group relative">
              Blood Group
              <InformationCircleIcon className="w-4 h-4 text-red-500 cursor-pointer" />
              <span className="absolute left-6 top-1/2 -translate-y-1/2 z-10 w-64 bg-white border border-gray-300 rounded shadow-lg px-3 py-2 text-xs text-gray-700 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
                Providing your blood group is a crucial piece of emergency information. It acts like a health insurance policy
              </span>
            </span>
          </label>
          <select
            className="w-full border px-2 py-1 rounded"
            value={bloodGroup}
            onChange={e => { setBloodGroup(e.target.value); saveField('blood_group', e.target.value); }}
          >
            <option value="">Select…</option>
            {bloodGroups.map(g => <option key={g}>{g}</option>)}
          </select>
        </div>
        {/* Address */}
        <div className="md:col-span-2">
          <label className="flex items-center gap-2">
            <MapPinIcon className="w-5 h-5" />Home Address
          </label>
          <input
            className="w-full border px-2 py-1 rounded"
            value={address}
            onChange={e => setAddress(e.target.value)}
            onBlur={() => saveField('address', address)}
          />
        </div>
      </div>

      {/* Only for providers: Bike & Plate */}
      {user?.is_provider && (
        <div className="space-y-4 border-t pt-4">
          <h2 className="text-xl font-semibold">Your Vehicle</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bike Model */}
            <div>
              <label className="flex items-center gap-2">
                <PhotoIcon className="w-5 h-5" /> Bike Model
              </label>
              <input
                type="text"
                className="w-full border px-2 py-1 rounded"
                value={docs.bike_model || ''}
                onChange={e => {
                  const v = e.target.value;
                  setDocs(d => ({ ...d, bike_model: v }));
                }}
                onBlur={async e => {
                  if (!user) return;
                  try {
                    await api.patch(`/api/providers/${user.id}`, { bike_model: e.target.value });
                    flash('Bike model saved');
                  } catch {
                    flash('Failed to save bike model');
                  }
                }}
              />
            </div>

            {/* Plate Number */}
            <div>
              <label className="flex items-center gap-2">
                <DocumentTextIcon className="w-5 h-5" /> Plate Number
              </label>
              <input
                className="w-full border px-2 py-1 rounded"
                value={docs.plate_number || ''}
                onChange={e => {
                  const v = e.target.value;
                  setDocs(d => ({ ...d, plate_number: v }));
                }}
                onBlur={async e => {
                  if (!user) return;
                  try {
                    await api.patch(`/api/providers/${user.id}`, { plate_number: e.target.value });
                    flash('Plate number saved');
                  } catch {
                    flash('Failed to save plate number');
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
      {/* Provider Docs */}
      {user?.is_provider && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Documents</h2>
          <div className="flex flex-wrap gap-4 mb-4">
            {/* License Preview */}
            {docs.license_url && (
              <div className="flex flex-col items-center">
                <span className="text-sm mb-1">License</span>
                {docs.license_url.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                  <a href={docs.license_url} target="_blank" rel="noopener noreferrer">
                    <Image
                      src={docs.license_url}
                      alt="License"
                      width={160}
                      height={100}
                      className="object-cover w-40 h-24 rounded border"
                      style={{ objectFit: 'cover', width: '10rem', height: '6rem' }}
                    />
                  </a>
                ) : (
                  <a
                    href={docs.license_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    View License (PDF)
                  </a>
                )}
              </div>
            )}
            {/* Insurance Preview */}
            {docs.insurance_url && (
              <div className="flex flex-col items-center">
                <span className="text-sm mb-1">Insurance</span>
                {docs.insurance_url.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                  <a href={docs.insurance_url} target="_blank" rel="noopener noreferrer">
                    <Image
                      src={docs.insurance_url}
                      alt="Insurance"
                      width={160}
                      height={100}
                      className="object-cover w-40 h-24 rounded border"
                      style={{ objectFit: 'cover', width: '10rem', height: '6rem' }}
                    />
                  </a>
                ) : (
                  <a
                    href={docs.insurance_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    View Insurance (PDF)
                  </a>
                )}
              </div>
            )}
            {/* Additional Images Preview */}
            {docs.additional_image_urls?.length
              ? docs.additional_image_urls.map((url, i) => (
                <div key={i} className="flex flex-col items-center">
                  <span className="text-sm mb-1">Extra {i + 1}</span>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <Image
                      src={url}
                      alt={`Extra ${i + 1}`}
                      width={160}
                      height={100}
                      className="object-cover w-40 h-24 rounded border"
                      style={{ objectFit: 'cover', width: '10rem', height: '6rem' }}
                    />
                  </a>
                </div>
              ))
              : null}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* License */}
            <div className="flex flex-col items-center">
              {newLicense && newLicense.name ? (
                <span className="text-sm">{newLicense.name}</span>
              ) : docs.license_url ? (
                <a href={docs.license_url} target="_blank" rel="noopener noreferrer">View License</a>
              ) : null}
              <label className="border rounded p-4 flex flex-col items-center cursor-pointer mt-2">
                <DocumentTextIcon className="w-6 h-6 text-gray-400" />
                <span className="mt-1 text-sm">Upload License</span>
                <input
                  type="file"
                  accept=".jpg,.png,.pdf"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setNewLicense(file);
                      uploadDoc('license', file);
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>
            {/* Insurance */}
            <div className="flex flex-col items-center">
              {newInsurance && newInsurance.name ? (
                <span className="text-sm">{newInsurance.name}</span>
              ) : docs.insurance_url ? (
                <a href={docs.insurance_url} target="_blank" rel="noopener noreferrer">View Insurance</a>
              ) : null}
              <label className="border rounded p-4 flex flex-col items-center cursor-pointer mt-2">
                <DocumentTextIcon className="w-6 h-6 text-gray-400" />
                <span className="mt-1 text-sm">Upload Insurance</span>
                <input
                  type="file"
                  accept=".jpg,.png,.pdf"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setNewInsurance(file);
                      uploadDoc('insurance', file);
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>
            {/* Extra Images */}
            <div className="flex flex-col items-center">
              {docs.additional_image_urls?.map((url, i) => (
                <Image
                  key={i}
                  src={url}
                  alt=""
                  width={400}
                  height={128}
                  className="object-cover w-full h-32 rounded border mb-2"
                  style={{ objectFit: 'cover', width: '100%', height: '8rem' }}
                />
              ))}
              {newImages.map((img, i) => (
                <Image
                  key={i}
                  src={URL.createObjectURL(img)}
                  alt=""
                  width={400}
                  height={128}
                  className="object-cover w-full h-32 rounded border ring-2 ring-blue-400 mb-2"
                  style={{ objectFit: 'cover', width: '100%', height: '8rem' }}
                />
              ))}
              <label className="border rounded p-4 flex flex-col items-center cursor-pointer mt-2">
                <PhotoIcon className="w-6 h-6 text-gray-400" />
                <span className="mt-1 text-sm">Upload Extras</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={e => {
                    const files = e.target.files ? Array.from(e.target.files) : [];
                    setNewImages(files);
                    if (files.length > 0) uploadDoc('images', files);
                  }}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
