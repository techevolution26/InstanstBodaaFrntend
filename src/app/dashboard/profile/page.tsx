'use client';
import { useState, useEffect, ChangeEvent } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import {
  UserCircleIcon, CalendarIcon, MapPinIcon, PhotoIcon, DocumentTextIcon,
  InformationCircleIcon, PhoneArrowDownLeftIcon, IdentificationIcon, PencilSquareIcon
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
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [address, setAddress] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [docs, setDocs] = useState<ProviderDocs>({});
  const [msg, setMsg] = useState('');

  // Fetch user and provider data
  useEffect(() => {
    let ignore = false;
    const fetchData = async () => {
      if (!user) {
        setLoadingProfile(false);
        return;
      }
      try {
        const { data } = await api.get('/api/me');
        if (ignore) return;
        setName(data.name || '');
        setPhone(data.phone || '');
        setDob(data.dob || '');
        setBloodGroup(data.blood_group || '');
        setAddress(data.address || '');
        setAvatarPreview(data.avatar_url || '');
      } catch {}
      if (user?.is_provider) {
        try {
          const { data } = await api.get(`/api/providers/${user.id}`);
          if (ignore) return;
          setDocs(data || {});
        } catch {}
      }
      setLoadingProfile(false);
    };
    fetchData();
    return () => { ignore = true; };
  }, [user]);

  const flash = (message: string) => {
    setMsg(message);
    setTimeout(() => setMsg(''), 3000);
  };

  // Save user field
  const saveField = async (field: string, value: string) => {
    try {
      await api.patch('/api/me', { [field]: value });
      flash('Saved!');
    } catch {
      flash('Update failed.');
    }
  };

  // Save provider field
  const saveProviderField = async (field: string, value: string) => {
    if (!user?.is_provider) return;
    try {
      await api.patch(`/api/providers/${user.id}`, { [field]: value });
      setDocs(d => ({ ...d, [field]: value }));
      flash('Saved!');
    } catch {
      flash('Update failed.');
    }
  };

  // Handle user field change
  const handleFieldChange = (setter: (v: string) => void, field: string) => {
    return (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const val = e.target.value;
      setter(val);
      saveField(field, val);
    };
  };

  // Avatar upload
  const onAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    const form = new FormData();
    form.append('avatar', file);
    try {
      await api.patch('/api/me', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      flash('Avatar updated!');
    } catch {
      flash('Avatar upload failed.');
    }
  };

  // Upload provider docs
  const uploadDoc = async (name: 'license' | 'insurance' | 'images', file: File | File[]) => {
    if (!user?.is_provider) return;
    const form = new FormData();
    if (name === 'images' && Array.isArray(file)) {
      file.forEach((f, i) => form.append(`images[${i}]`, f));
    } else if (file instanceof File) {
      form.append(name, file);
    }
    try {
      await api.post(`/api/providers/${user.id}/docs`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const { data } = await api.get(`/api/providers/${user.id}`);
      setDocs(data || {});
      flash('Uploaded!');
    } catch {
      flash('Upload failed.');
    }
  };

  if (loadingProfile) return <p className="text-center py-12">Loading profile…</p>;

  const bloodGroups = ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−'];

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <UserCircleIcon className="w-6 h-6 text-indigo-600" />
        Your Profile
      </h1>
      {msg && <p className="text-green-600">{msg}</p>}

      {/* Avatar */}
      <div className="relative w-24 h-24">
        <div className="w-24 h-24 rounded-full border overflow-hidden flex items-center justify-center bg-white">
          {avatarPreview ? (
            <Image src={avatarPreview} alt="Avatar" width={96} height={96} className="object-cover w-full h-full" />
          ) : (
            <UserCircleIcon className="w-20 h-20 text-gray-300" />
          )}
        </div>
        <label className="absolute bottom-0 right-0 bg-white border rounded-full p-1 shadow cursor-pointer hover:bg-gray-100 transition">
          <PencilSquareIcon className="w-5 h-5 text-gray-600" />
          <input type="file" accept="image/*" onChange={onAvatarChange} className="hidden" />
        </label>
      </div>

      {/* Basic Info */}
      <div className="grid md:grid-cols-2 gap-4">
        <InputField label="Name" icon={IdentificationIcon} value={name} onChange={handleFieldChange(setName, 'name')} />
        <InputField label="Phone" icon={PhoneArrowDownLeftIcon} value={phone} onChange={handleFieldChange(setPhone, 'phone')} />
        <InputField type="date" label="DOB" icon={CalendarIcon} value={dob} onChange={handleFieldChange(setDob, 'dob')} />
        <div>
          <label className="flex items-center gap-2 text-sm font-medium mb-1">
            Blood Group <InformationCircleIcon className="w-4 h-4 text-red-400" />
          </label>
          <select
            value={bloodGroup}
            onChange={handleFieldChange(setBloodGroup, 'blood_group')}
            className="w-full border px-2 py-1 rounded"
          >
            <option value="">Select…</option>
            {bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
          </select>
        </div>
        <InputField label="Home Address" icon={MapPinIcon} value={address} onChange={handleFieldChange(setAddress, 'address')} full />
      </div>

      {/* Provider Fields */}
      {user?.is_provider && (
        <>
          <h2 className="text-xl font-semibold pt-4 border-t">Vehicle</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <InputField
              label="Bike Model"
              icon={PhotoIcon}
              value={docs.bike_model || ''}
              onChange={e => setDocs(d => ({ ...d, bike_model: e.target.value }))}
              onBlur={() => saveProviderField('bike_model', docs.bike_model || '')}
            />
            <InputField
              label="Plate Number"
              icon={DocumentTextIcon}
              value={docs.plate_number || ''}
              onChange={e => setDocs(d => ({ ...d, plate_number: e.target.value }))}
              onBlur={() => saveProviderField('plate_number', docs.plate_number || '')}
            />
          </div>

          <h2 className="text-xl font-semibold pt-4 border-t">Documents</h2>
          <UploadDocSection
            label="License"
            onFileSelect={file => uploadDoc('license', file)}
            url={docs.license_url}
          />
          <UploadDocSection
            label="Insurance"
            onFileSelect={file => uploadDoc('insurance', file)}
            url={docs.insurance_url}
          />
          <UploadDocSection
            label="Additional Images"
            multiple
            onFileSelect={files => {
              if (Array.isArray(files)) uploadDoc('images', files);
            }}
            images={docs.additional_image_urls || []}
          />
        </>
      )}
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  onBlur,
  icon: Icon,
  type = 'text',
  full = false
}: {
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  icon: React.ElementType;
  type?: string;
  full?: boolean;
}) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <label className="flex items-center gap-2 text-sm font-medium mb-1">
        <Icon className="w-4 h-4 text-gray-500" />
        {label}
      </label>
      <input
        type={type}
        className="w-full border px-2 py-1 rounded"
        value={value}
        onChange={onChange}
        onBlur={onBlur}
      />
    </div>
  );
}

function UploadDocSection({
  label,
  url,
  onFileSelect,
  images = [],
  multiple = false
}: {
  label: string;
  url?: string;
  images?: string[];
  onFileSelect: (file: File | File[]) => void;
  multiple?: boolean;
}) {
  return (
    <div className="mt-2">
      <p className="text-sm font-medium mb-1">{label}</p>
      {url && (
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm">
          View {label}
        </a>
      )}
      <div className="flex gap-4 mt-2 flex-wrap">
        {images.map((img, i) => (
          <Image key={i} src={img} alt="" width={160} height={100} className="rounded border object-cover" />
        ))}
      </div>
      <label className="border-2 border-dashed w-full text-center mt-2 p-4 cursor-pointer text-gray-600 hover:border-indigo-500 transition block rounded">
        <PhotoIcon className="w-6 h-6 mx-auto" />
        <span className="text-sm">Click to upload</span>
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={e => {
            const files = e.target.files;
            if (!files) return;
            if (multiple) onFileSelect(Array.from(files));
            else onFileSelect(files[0]);
          }}
          multiple={multiple}
          className="hidden"
        />
      </label>
    </div>
  );
}
