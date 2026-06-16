function buildDoctorFields(profile, clinic, name) {
  const specialty =
    profile.specialty ||
    (clinic.specialties?.length ? clinic.specialties[0] : '');

  return {
    name: name || clinic.name,
    photo: profile.photo || clinic.image || '',
    specialty,
    degree: profile.degree || '',
    gender: profile.gender || '',
    rank: profile.rank || '',
    country: profile.country || 'LY',
    city: profile.city || '',
    availableForConsultation: profile.availableForConsultation ?? false,
    rating: profile.rating ?? 0,
    ratingCount: profile.ratingCount ?? 0,
    views: profile.views ?? 0,
    bio: profile.bio || clinic.description || '',
  };
}

exports.buildDoctorResponse = (clinic) => {
  const profile = clinic.doctorProfile || {};
  const doctorName = clinic.userId?.name || clinic.name;
  return buildDoctorFields(profile, clinic, doctorName);
};

exports.buildDoctorFromDoc = (clinic, doc) => ({
  _id: String(doc._id),
  ...buildDoctorFields(doc, clinic, doc.name),
});

exports.buildDoctorsList = (clinic) => {
  const active = (clinic.doctors || []).filter((d) => d.isActive !== false);
  if (active.length > 0) {
    return active.map((d) => exports.buildDoctorFromDoc(clinic, d));
  }
  if (clinic.facilityType === 'hospital') {
    return [];
  }
  return [{ _id: 'primary', ...exports.buildDoctorResponse(clinic) }];
};

exports.findDoctorInClinic = (clinic, doctorId) => {
  if (!doctorId || doctorId === 'primary') {
    return { type: 'primary', doc: null };
  }
  const doc = clinic.doctors?.id?.(doctorId) || clinic.doctors?.find?.((d) => String(d._id) === String(doctorId));
  if (doc) return { type: 'doctor', doc };
  return { type: 'primary', doc: null };
};
