import { loadConversations, selectConversation } from './conversations.js'
import { state } from './state.js'
import { closeNewChatModal, createUserElement, loadRegisteredUsers } from './users.js'
import { $, api, getConversationById, getCurrentUserId, getUserInitials } from './utils.js'

// ==================================================
// CRÉATION D'UN GROUPE
// ==================================================

const createGroupButton = $('#createGroupButton')

const createGroupModal = $('#createGroupModal')

const closeCreateGroupButton = $('#closeCreateGroup')

const cancelCreateGroupButton = $('#cancelCreateGroup')

const confirmCreateGroupButton = $('#confirmCreateGroup')

const groupNameInput = $('#groupName')

const groupDescriptionInput = $('#groupDescription')

const groupMemberSearch = $('#groupMemberSearch')

const groupMembersList = $('#groupMembersList')

const groupSelectedCount = $('#groupSelectedCount')

const createGroupError = $('#createGroupError')

const selectedGroupMemberIds = new Set()

const CREATE_GROUP_BUTTON_HTML =
  '<i class="fa-solid fa-users" aria-hidden="true"></i><span>Créer le groupe</span>'

function showCreateGroupError(message) {
  if (!createGroupError) return

  createGroupError.textContent = message
  createGroupError.classList.toggle('hidden', !message)
}

function updateCreateGroupUI() {
  if (groupSelectedCount) {
    groupSelectedCount.textContent = String(selectedGroupMemberIds.size)
  }

  if (confirmCreateGroupButton) {
    confirmCreateGroupButton.disabled =
      state.creatingGroup ||
      groupNameInput.value.trim().length < 2 ||
      selectedGroupMemberIds.size === 0
  }
}

function renderGroupMembers(query = '') {
  if (!groupMembersList) return

  const currentUserId = getCurrentUserId()
  const normalizedQuery = query.trim().toLowerCase()

  const users = state.registeredUsers
    .filter((user) => Number(user.id) !== currentUserId)
    .filter(
      (user) =>
        (user.fullName || '').toLowerCase().includes(normalizedQuery) ||
        (user.username || '').toLowerCase().includes(normalizedQuery)
    )

  groupMembersList.replaceChildren()

  if (!users.length) {
    const empty = document.createElement('p')

    empty.className = 'py-4 text-center text-sm text-gray-500'
    empty.textContent = 'Aucun utilisateur trouvé.'
    groupMembersList.appendChild(empty)

    return
  }

  users.forEach((user) => {
    const label = document.createElement('label')

    label.className =
      'flex w-full cursor-pointer items-center gap-3 rounded-xl p-3 transition-colors hover:bg-emerald-50'

    const checkbox = document.createElement('input')

    checkbox.type = 'checkbox'
    checkbox.className = 'h-4 w-4 shrink-0 cursor-pointer accent-[#075e8d]'
    checkbox.checked = selectedGroupMemberIds.has(Number(user.id))

    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        selectedGroupMemberIds.add(Number(user.id))
      } else {
        selectedGroupMemberIds.delete(Number(user.id))
      }

      updateCreateGroupUI()
    })

    // Réutilise l'avatar + nom de createUserElement
    const userItem = createUserElement(user)

    label.append(checkbox, ...userItem.childNodes)
    groupMembersList.appendChild(label)
  })
}

function openCreateGroupModal() {
  if (!createGroupModal) return

  closeNewChatModal()

  selectedGroupMemberIds.clear()
  groupNameInput.value = ''
  groupDescriptionInput.value = ''
  groupMemberSearch.value = ''
  showCreateGroupError('')

  renderGroupMembers()
  updateCreateGroupUI()

  createGroupModal.classList.remove('hidden')
  createGroupModal.classList.add('flex')

  if (!state.registeredUsers.length) {
    loadRegisteredUsers().then(() => renderGroupMembers())
  }

  groupNameInput.focus()
}

function closeCreateGroupModal() {
  if (!createGroupModal || state.creatingGroup) return

  createGroupModal.classList.add('hidden')
  createGroupModal.classList.remove('flex')
}

async function createGroup() {
  if (state.creatingGroup) return

  const name = groupNameInput.value.trim()

  if (name.length < 2) {
    showCreateGroupError('Le nom du groupe doit contenir au moins 2 caractères.')
    return
  }

  if (!selectedGroupMemberIds.size) {
    showCreateGroupError('Sélectionne au moins un membre.')
    return
  }

  state.creatingGroup = true
  showCreateGroupError('')

  confirmCreateGroupButton.disabled = true
  confirmCreateGroupButton.innerHTML =
    '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i><span>Création...</span>'

  try {
    const result = await api('/groups', {
      method: 'POST',
      body: JSON.stringify({
        name,
        description: groupDescriptionInput.value.trim(),
        memberIds: Array.from(selectedGroupMemberIds),
      }),
    })

    const conversationId = Number(result?.data?.conversationId)

    state.creatingGroup = false
    closeCreateGroupModal()

    await loadConversations(true)

    if (conversationId) {
      selectConversation(conversationId)
    }
  } catch (error) {
    if (error.message === 'SESSION_EXPIRED') {
      window.location.reload()
      return
    }

    showCreateGroupError(
      error.message.startsWith('REQUEST_FAILED')
        ? 'Impossible de créer le groupe. Réessaie.'
        : error.message
    )
  } finally {
    state.creatingGroup = false
    confirmCreateGroupButton.innerHTML = CREATE_GROUP_BUTTON_HTML
    updateCreateGroupUI()
  }
}

// ==================================================
// INFOS DU GROUPE
// ==================================================

const groupInfoModal = $('#groupInfoModal')
const closeGroupInfoButton = $('#closeGroupInfo')
const groupInfoAvatar = $('#groupInfoAvatar')
const groupInfoName = $('#groupInfoName')
const groupInfoDescription = $('#groupInfoDescription')
const groupInfoMembersCount = $('#groupInfoMembersCount')
const groupInfoSearch = $('#groupInfoSearch')
const groupInfoMembers = $('#groupInfoMembers')
const groupInfoError = $('#groupInfoError')
const changeGroupAvatarButton = $('#changeGroupAvatarButton')
const groupAvatarInput = $('#groupAvatarInput')

function showGroupInfoError(message) {
  if (!groupInfoError) return

  groupInfoError.textContent = message
  groupInfoError.classList.toggle('hidden', !message)
}

function showGroupInfoMessage(message) {
  groupInfoMembers.replaceChildren()

  const paragraph = document.createElement('p')

  paragraph.className = 'py-4 text-center text-sm text-gray-500'
  paragraph.textContent = message

  groupInfoMembers.appendChild(paragraph)
}

function renderGroupInfoHeader(name, description, avatarUrl) {
  groupInfoName.textContent = name || 'Groupe'
  groupInfoDescription.textContent = description || 'Aucune description.'

  groupInfoAvatar.replaceChildren()
  groupInfoAvatar.textContent = ''

  if (avatarUrl) {
    const img = document.createElement('img')

    img.src = avatarUrl
    img.alt = ''
    img.className = 'h-full w-full object-cover'

    img.addEventListener(
      'error',
      () => {
        img.remove()
        groupInfoAvatar.textContent = getUserInitials({
          fullName: name,
        })
      },
      { once: true }
    )

    groupInfoAvatar.appendChild(img)
  } else {
    groupInfoAvatar.textContent = getUserInitials({
      fullName: name,
    })
  }
}

function renderGroupInfoMembers(query = '') {
  if (!state.groupInfo || !groupInfoMembers) return

  const normalizedQuery = query.trim().toLowerCase()
  const currentUserId = getCurrentUserId()

  groupInfoMembersCount.textContent = String(state.groupInfo.members.length)

  const members = state.groupInfo.members
    .filter(
      (member) =>
        (member.fullName || '').toLowerCase().includes(normalizedQuery) ||
        (member.username || '').toLowerCase().includes(normalizedQuery)
    )
    .sort((a, b) => {
      if (a.roleId !== b.roleId) {
        return a.roleId - b.roleId
      }

      return (a.fullName || '').localeCompare(b.fullName || '', 'fr')
    })

  if (!members.length) {
    showGroupInfoMessage('Aucun membre trouvé.')
    return
  }

  groupInfoMembers.replaceChildren()

  members.forEach((member) => {
    const row = document.createElement('div')

    row.className = 'flex w-full items-center gap-3 rounded-xl p-3'

    const avatar = document.createElement('div')

    avatar.className =
      'flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#075e8d] text-sm font-semibold text-white'

    if (member.avatar) {
      const img = document.createElement('img')

      img.src = member.avatar
      img.alt = ''
      img.className = 'h-full w-full object-cover'

      img.addEventListener(
        'error',
        () => {
          img.remove()
          avatar.textContent = getUserInitials(member)
        },
        { once: true }
      )

      avatar.appendChild(img)
    } else {
      avatar.textContent = getUserInitials(member)
    }

    const details = document.createElement('div')

    details.className = 'min-w-0 flex-1'

    const name = document.createElement('p')

    name.className = 'truncate text-sm font-semibold text-slate-800'
    name.textContent =
      (member.fullName || member.username || 'Utilisateur') +
      (Number(member.id) === currentUserId ? ' (Vous)' : '')

    const username = document.createElement('p')

    username.className = 'truncate text-xs text-slate-500'
    username.textContent = member.username ? `@${member.username}` : ''

    details.append(name, username)

    const isAdmin = member.roleId === 1
    const badge = document.createElement('span')

    badge.className =
      'shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ' +
      (isAdmin ? 'bg-emerald-500/15 text-emerald-700' : 'bg-sky-500/15 text-sky-700')

    badge.textContent = isAdmin ? 'Admin' : 'Membre'

    row.append(avatar, details, badge)
    groupInfoMembers.appendChild(row)
  })
}

async function openGroupInfo() {
  const conversation = getConversationById(state.selectedConversationId)

  if (!conversation?.groupId || !groupInfoModal) {
    return
  }

  state.groupInfo = null
  updateGroupInfoMenu()
  groupInfoSearch.value = ''
  groupInfoMembersCount.textContent = '0'
  showGroupInfoError('')

  // Affichage immédiat avec les infos déjà connues
  renderGroupInfoHeader(
    conversation.group?.name,
    conversation.group?.description,
    conversation.group?.avatar
  )

  showGroupInfoMessage('Chargement des membres...')

  groupInfoModal.classList.remove('hidden')
  groupInfoModal.classList.add('flex')

  try {
    const result = await api(`/conversations/${conversation.id}/group`)

    state.groupInfo = result.data
    updateGroupInfoMenu()

    renderGroupInfoHeader(
      state.groupInfo.group.name,
      state.groupInfo.group.description,
      state.groupInfo.group.avatar
    )

    renderGroupInfoMembers()
  } catch (error) {
    if (error.message === 'SESSION_EXPIRED') {
      window.location.reload()
      return
    }

    groupInfoMembers.replaceChildren()
    showGroupInfoError('Impossible de charger les infos du groupe.')
  }
}

function closeGroupInfo() {
  if (!groupInfoModal) return

  closeGroupInfoMenu()
  closeAddMembers()
  closeRemoveMembers()
  closeRemoveMembersConfirm()

  groupInfoModal.classList.add('hidden')
  groupInfoModal.classList.remove('flex')
}

function getCsrfToken() {
  const token = document.cookie.split('; ').find((row) => row.startsWith('XSRF-TOKEN='))
  return token ? decodeURIComponent(token.split('=')[1]) : null
}

async function changeGroupAvatar(file) {
  if (!state.groupInfo || state.groupInfo.myRole !== 'admin') return
  showGroupInfoError('')

  // Vérifier que c'est une image de 5 Mo maximum
  if (!file.type.startsWith('image/')) {
    showGroupInfoError('Veuillez sélectionner une image valide.')
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    showGroupInfoError('La photo ne doit pas dépasser 5 Mo.')
    return
  }

  const conversationId = state.selectedConversationId
  const cameraIcon = changeGroupAvatarButton?.querySelector('i')

  changeGroupAvatarButton.disabled = true
  cameraIcon?.classList.replace('fa-camera', 'fa-spinner')
  cameraIcon?.classList.add('fa-spin')

  try {
    const formData = new FormData()
    formData.append('avatar', file)
    const headers = { Accept: 'application/json' }
    const csrfToken = getCsrfToken()
    if (csrfToken) {
      headers['X-XSRF-TOKEN'] = csrfToken
    }
    const response = await fetch(`/conversations/${conversationId}/group/avatar`, {
      method: 'PATCH',
      headers,
      credentials: 'same-origin',
      body: formData,
    })
    const result = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(result.message || "Impossible d'enregistrer la photo.")
    }

    state.groupInfo.group.avatar = result.data.avatar

    renderGroupInfoHeader(
      state.groupInfo.group.name,
      state.groupInfo.group.description,
      state.groupInfo.group.avatar
    )

    // Met à jour la liste et l'en-tête du chat
    await loadConversations(true)
  } catch (error) {
    showGroupInfoError(error.message || 'Une erreur est survenue.')
  } finally {
    changeGroupAvatarButton.disabled = false
    cameraIcon?.classList.remove('fa-spin')
    cameraIcon?.classList.replace('fa-spinner', 'fa-camera')
  }
}

// ==================================================
// MENU DES OPTIONS DU GROUPE (ADMIN)
// ==================================================

const groupInfoMenuWrapper = $('#groupInfoMenuWrapper')
const groupInfoMenuButton = $('#groupInfoMenuButton')
const groupInfoMenu = $('#groupInfoMenu')

function closeGroupInfoMenu() {
  groupInfoMenu?.classList.add('hidden')
}

function updateGroupInfoMenu() {
  const isAdmin = state.groupInfo?.myRole === 'admin'

  groupInfoMenuWrapper?.classList.toggle('hidden', !isAdmin)
  changeGroupAvatarButton?.classList.toggle('hidden', !isAdmin)
  changeGroupAvatarButton?.classList.toggle('flex', isAdmin)

  if (!isAdmin) {
    closeGroupInfoMenu()
  }
}

function handleGroupAction(action) {
  if (action === 'edit-info') {
    openEditGroupModal()
    return
  }

  if (action === 'add-admin') {
    openAddMembers()
    return
  }

  if (action === 'remove-member') {
    openRemoveMembers()
    return
  }
  if (action === 'delete-group') {
    openDeleteGroupConfirm()
    return
  }

  // Les autres actions seront implémentées ensuite.
  console.log('Action de groupe :', action)
}

// ==================================================
// AJOUTER DES MEMBRES AU GROUPE
// ==================================================

const groupInfoMembersSection = $('#groupInfoMembersSection')

const addMembersSection = $('#addMembersSection')

const addMembersSearch = $('#addMembersSearch')

const addMembersList = $('#addMembersList')

const addMembersSelectedCount = $('#addMembersSelectedCount')

const cancelAddMembersButton = $('#cancelAddMembers')

const confirmAddMembersButton = $('#confirmAddMembers')

const selectedNewMemberIds = new Set()

let isAddingMembers = false

const ADD_MEMBERS_BUTTON_HTML =
  '<i class="fa-solid fa-user-plus" aria-hidden="true"></i><span>Ajouter</span>'

function updateAddMembersUI() {
  if (addMembersSelectedCount) {
    addMembersSelectedCount.textContent = String(selectedNewMemberIds.size)
  }

  // Le bouton Ajouter n'est cliquable que si au moins un utilisateur est coché
  if (confirmAddMembersButton) {
    confirmAddMembersButton.disabled = isAddingMembers || selectedNewMemberIds.size === 0
  }
}

function renderAddMembersList(query = '') {
  if (!addMembersList || !state.groupInfo) return

  const currentMemberIds = new Set(state.groupInfo.members.map((member) => Number(member.id)))

  const normalizedQuery = query.trim().toLowerCase()

  // Uniquement les utilisateurs qui ne sont pas encore membres
  const users = state.registeredUsers
    .filter((user) => !currentMemberIds.has(Number(user.id)))
    .filter(
      (user) =>
        (user.fullName || '').toLowerCase().includes(normalizedQuery) ||
        (user.username || '').toLowerCase().includes(normalizedQuery)
    )

  addMembersList.replaceChildren()

  if (!users.length) {
    const empty = document.createElement('p')

    empty.className = 'py-4 text-center text-sm text-gray-500'
    empty.textContent = normalizedQuery
      ? 'Aucun utilisateur trouvé.'
      : 'Tous les utilisateurs sont déjà membres du groupe.'

    addMembersList.appendChild(empty)

    return
  }

  users.forEach((user) => {
    const label = document.createElement('label')

    label.className =
      'flex w-full cursor-pointer items-center gap-3 rounded-xl p-3 transition-colors hover:bg-emerald-50'

    const checkbox = document.createElement('input')

    checkbox.type = 'checkbox'
    checkbox.className = 'h-4 w-4 shrink-0 cursor-pointer accent-[#075e8d]'
    checkbox.checked = selectedNewMemberIds.has(Number(user.id))

    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        selectedNewMemberIds.add(Number(user.id))
      } else {
        selectedNewMemberIds.delete(Number(user.id))
      }

      updateAddMembersUI()
    })

    const userItem = createUserElement(user)

    label.append(checkbox, ...userItem.childNodes)
    addMembersList.appendChild(label)
  })
}

function openAddMembers() {
  if (!state.groupInfo || state.groupInfo.myRole !== 'admin') return
  if (!groupInfoMembersSection || !addMembersSection) return

  selectedNewMemberIds.clear()
  addMembersSearch.value = ''
  showGroupInfoError('')

  // Cacher la partie "Membres", afficher la liste des non-membres
  groupInfoMembersSection.classList.add('hidden')
  groupInfoMembersSection.classList.remove('flex')

  addMembersSection.classList.remove('hidden')
  addMembersSection.classList.add('flex')

  renderAddMembersList()
  updateAddMembersUI()

  if (!state.registeredUsers.length) {
    loadRegisteredUsers().then(() => renderAddMembersList())
  }
}

function closeAddMembers() {
  if (isAddingMembers) return
  if (!groupInfoMembersSection || !addMembersSection) return

  addMembersSection.classList.add('hidden')
  addMembersSection.classList.remove('flex')

  groupInfoMembersSection.classList.remove('hidden')
  groupInfoMembersSection.classList.add('flex')

  selectedNewMemberIds.clear()
  showGroupInfoError('')
}

async function confirmAddMembers() {
  if (isAddingMembers || !selectedNewMemberIds.size || !state.groupInfo) return

  const conversationId = state.selectedConversationId

  isAddingMembers = true
  showGroupInfoError('')

  confirmAddMembersButton.disabled = true
  confirmAddMembersButton.innerHTML =
    '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i><span>Ajout...</span>'

  try {
    await api(`/conversations/${conversationId}/group/members`, {
      method: 'POST',
      body: JSON.stringify({
        memberIds: Array.from(selectedNewMemberIds),
      }),
    })

    // Recharger les infos du groupe pour afficher les nouveaux membres
    const result = await api(`/conversations/${conversationId}/group`)

    state.groupInfo = result.data

    isAddingMembers = false
    closeAddMembers()

    groupInfoSearch.value = ''
    renderGroupInfoMembers()
  } catch (error) {
    if (error.message === 'SESSION_EXPIRED') {
      window.location.reload()
      return
    }

    showGroupInfoError(
      error.message.startsWith('REQUEST_FAILED')
        ? "Impossible d'ajouter les membres. Réessaie."
        : error.message
    )
  } finally {
    isAddingMembers = false
    confirmAddMembersButton.innerHTML = ADD_MEMBERS_BUTTON_HTML
    updateAddMembersUI()
  }
}

// ==================================================
// RETIRER DES MEMBRES DU GROUPE
// ==================================================

const removeMembersSection = $('#removeMembersSection')
const removeMembersSelectedCount = $('#removeMembersSelectedCount')
const removeMembersSearch = $('#removeMembersSearch')
const removeMembersList = $('#removeMembersList')

const cancelRemoveMembersButton = $('#cancelRemoveMembers')
const confirmRemoveMembersButton = $('#confirmRemoveMembers')

const removeMembersConfirmModal = $('#removeMembersConfirmModal')
const removeMembersConfirmMessage = $('#removeMembersConfirmMessage')
const removeMembersConfirmError = $('#removeMembersConfirmError')

const cancelRemoveMembersConfirmButton = $('#cancelRemoveMembersConfirm')
const validateRemoveMembersButton = $('#validateRemoveMembers')

const selectedRemoveMemberIds = new Set()

let isRemovingMembers = false

const REMOVE_MEMBERS_BUTTON_HTML =
  '<i class="fa-solid fa-user-minus" aria-hidden="true"></i><span>Retirer</span>'

const VALIDATE_REMOVE_BUTTON_HTML =
  '<i class="fa-solid fa-trash-can" aria-hidden="true"></i><span>Confirmer</span>'

// Afficher une erreur dans la fenêtre de confirmation
function showRemoveMembersConfirmError(message) {
  if (!removeMembersConfirmError) return

  removeMembersConfirmError.textContent = message
  removeMembersConfirmError.classList.toggle('hidden', !message)
}

// Mettre à jour le compteur et le bouton Retirer
function updateRemoveMembersUI() {
  if (removeMembersSelectedCount) {
    removeMembersSelectedCount.textContent = String(selectedRemoveMemberIds.size)
  }

  if (confirmRemoveMembersButton) {
    confirmRemoveMembersButton.disabled = isRemovingMembers || selectedRemoveMemberIds.size === 0
  }
}

// Afficher les membres pouvant être retirés
function renderRemoveMembersList(query = '') {
  if (!removeMembersList || !state.groupInfo) return

  const normalizedQuery = query.trim().toLowerCase()

  // Seuls les membres classiques peuvent être sélectionnés
  const members = state.groupInfo.members
    .filter((member) => member.roleId === 2)
    .filter(
      (member) =>
        (member.fullName || '').toLowerCase().includes(normalizedQuery) ||
        (member.username || '').toLowerCase().includes(normalizedQuery)
    )
    .sort((a, b) => (a.fullName || '').localeCompare(b.fullName || '', 'fr'))

  removeMembersList.replaceChildren()

  if (!members.length) {
    const empty = document.createElement('p')

    empty.className = 'py-4 text-center text-sm text-gray-500'
    empty.textContent = normalizedQuery
      ? 'Aucun membre trouvé.'
      : 'Aucun membre ne peut être retiré.'

    removeMembersList.appendChild(empty)
    return
  }

  members.forEach((member) => {
    const label = document.createElement('label')

    label.className =
      'flex w-full cursor-pointer items-center gap-3 rounded-xl p-3 transition-colors hover:bg-red-50'

    const checkbox = document.createElement('input')

    checkbox.type = 'checkbox'
    checkbox.className = 'h-4 w-4 shrink-0 cursor-pointer accent-red-600'

    checkbox.checked = selectedRemoveMemberIds.has(Number(member.id))

    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        selectedRemoveMemberIds.add(Number(member.id))
      } else {
        selectedRemoveMemberIds.delete(Number(member.id))
      }

      updateRemoveMembersUI()
    })

    // Réutiliser l'affichage des avatars et des noms
    const userItem = createUserElement(member)

    label.append(checkbox, ...userItem.childNodes)
    removeMembersList.appendChild(label)
  })
}

// Ouvrir la section de sélection
function openRemoveMembers() {
  if (!state.groupInfo || state.groupInfo.myRole !== 'admin') return
  if (!groupInfoMembersSection || !removeMembersSection) return

  selectedRemoveMemberIds.clear()
  removeMembersSearch.value = ''

  showGroupInfoError('')

  groupInfoMembersSection.classList.add('hidden')
  groupInfoMembersSection.classList.remove('flex')

  addMembersSection.classList.add('hidden')
  addMembersSection.classList.remove('flex')

  removeMembersSection.classList.remove('hidden')
  removeMembersSection.classList.add('flex')

  renderRemoveMembersList()
  updateRemoveMembersUI()
}

// Revenir à la liste normale des membres
function closeRemoveMembers() {
  if (isRemovingMembers) return

  if (!groupInfoMembersSection || !removeMembersSection) return

  removeMembersSection.classList.add('hidden')
  removeMembersSection.classList.remove('flex')

  groupInfoMembersSection.classList.remove('hidden')
  groupInfoMembersSection.classList.add('flex')

  selectedRemoveMemberIds.clear()
  removeMembersSearch.value = ''

  updateRemoveMembersUI()
  showGroupInfoError('')
}

// Ouvrir la fenêtre de confirmation
function openRemoveMembersConfirm() {
  if (!selectedRemoveMemberIds.size || isRemovingMembers) return

  const count = selectedRemoveMemberIds.size

  removeMembersConfirmMessage.textContent =
    count === 1
      ? 'Voulez-vous vraiment retirer ce membre du groupe ?'
      : `Voulez-vous vraiment retirer ces ${count} membres du groupe ?`

  showRemoveMembersConfirmError('')

  removeMembersConfirmModal.classList.remove('hidden')
  removeMembersConfirmModal.classList.add('flex')
}

// Fermer la fenêtre de confirmation
function closeRemoveMembersConfirm() {
  if (isRemovingMembers) return

  removeMembersConfirmModal.classList.add('hidden')
  removeMembersConfirmModal.classList.remove('flex')

  showRemoveMembersConfirmError('')
}

// Envoyer la demande de retrait au serveur
async function confirmRemoveMembers() {
  if (isRemovingMembers || !selectedRemoveMemberIds.size || !state.groupInfo) {
    return
  }

  const conversationId = state.selectedConversationId

  const memberIds = Array.from(selectedRemoveMemberIds)

  isRemovingMembers = true

  showRemoveMembersConfirmError('')

  validateRemoveMembersButton.disabled = true
  validateRemoveMembersButton.innerHTML =
    '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i><span>Retrait...</span>'

  try {
    await api(`/conversations/${conversationId}/group/members`, {
      method: 'DELETE',
      body: JSON.stringify({
        memberIds,
      }),
    })

    // Recharger les informations du groupe
    const result = await api(`/conversations/${conversationId}/group`)

    state.groupInfo = result.data

    // Fermer les fenêtres et réinitialiser la sélection
    isRemovingMembers = false

    closeRemoveMembersConfirm()
    closeRemoveMembers()

    // Afficher la nouvelle liste des membres
    groupInfoSearch.value = ''
    renderGroupInfoMembers()

    // Actualiser la liste des conversations
    await loadConversations(true)
  } catch (error) {
    if (error.message === 'SESSION_EXPIRED') {
      window.location.reload()
      return
    }

    showRemoveMembersConfirmError(
      error.message.startsWith('REQUEST_FAILED')
        ? 'Impossible de retirer les membres. Réessaie.'
        : error.message
    )
  } finally {
    isRemovingMembers = false

    validateRemoveMembersButton.disabled = false
    validateRemoveMembersButton.innerHTML = VALIDATE_REMOVE_BUTTON_HTML

    updateRemoveMembersUI()
  }
}

// ==================================================
// MODIFIER LE NOM ET LA DESCRIPTION DU GROUPE
// ==================================================

const editGroupModal = $('#editGroupModal')
const editGroupNameInput = $('#editGroupName')
const editGroupDescriptionInput = $('#editGroupDescription')
const editGroupError = $('#editGroupError')
const saveEditGroupButton = $('#saveEditGroup')
const cancelEditGroupButton = $('#cancelEditGroup')
const closeEditGroupButton = $('#closeEditGroup')

// ==================================================
// SUPPRIMER LE GROUPE
// ==================================================

const deleteGroupConfirmModal = $('#deleteGroupConfirmModal')
const cancelDeleteGroupButton = $('#cancelDeleteGroup')
const confirmDeleteGroupButton = $('#confirmDeleteGroup')
const deleteGroupConfirmError = $('#deleteGroupConfirmError')

let isDeletingGroup = false

const DELETE_GROUP_BUTTON_HTML =
  '<i class="fa-solid fa-trash-can" aria-hidden="true"></i><span>Oui, supprimer</span>'

function showDeleteGroupError(message) {
  if (!deleteGroupConfirmError) return

  deleteGroupConfirmError.textContent = message
  deleteGroupConfirmError.classList.toggle('hidden', !message)
}

// Ouvrir la confirmation
function openDeleteGroupConfirm() {
  if (!state.groupInfo || state.groupInfo.myRole !== 'admin') return
  if (!deleteGroupConfirmModal || isDeletingGroup) return

  showDeleteGroupError('')

  deleteGroupConfirmModal.classList.remove('hidden')
  deleteGroupConfirmModal.classList.add('flex')
}

// Fermer la confirmation
function closeDeleteGroupConfirm() {
  if (isDeletingGroup || !deleteGroupConfirmModal) return

  deleteGroupConfirmModal.classList.add('hidden')
  deleteGroupConfirmModal.classList.remove('flex')

  showDeleteGroupError('')
}

// Confirmer la suppression
async function deleteGroup() {
  if (isDeletingGroup || !state.groupInfo) return

  if (state.groupInfo.myRole !== 'admin') return

  const conversationId = Number(state.selectedConversationId)

  if (!conversationId) return

  isDeletingGroup = true

  showDeleteGroupError('')

  confirmDeleteGroupButton.disabled = true
  cancelDeleteGroupButton.disabled = true

  confirmDeleteGroupButton.innerHTML =
    '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i><span>Suppression...</span>'

  try {
    await api(`/conversations/${conversationId}/group`, {
      method: 'DELETE',
    })

    // Le serveur a confirmé la suppression.
    // Recharger l'application pour actualiser la liste des conversations.
    window.location.reload()
  } catch (error) {
    if (error.message === 'SESSION_EXPIRED') {
      window.location.reload()
      return
    }
    showDeleteGroupError(
      error.message.startsWith('REQUEST_FAILED')
        ? 'Impossible de supprimer le groupe. Réessaie.'
        : error.message
    )
  } finally {
    isDeletingGroup = false
    confirmDeleteGroupButton.disabled = false
    cancelDeleteGroupButton.disabled = false
    confirmDeleteGroupButton.innerHTML = DELETE_GROUP_BUTTON_HTML
  }
}

function showEditGroupError(message) {
  if (!editGroupError) return

  editGroupError.textContent = message
  editGroupError.classList.toggle('hidden', !message)
}

function updateEditGroupUI() {
  if (saveEditGroupButton) {
    saveEditGroupButton.disabled =
      state.savingGroupInfo || editGroupNameInput.value.trim().length < 2
  }
}

function openEditGroupModal() {
  if (!state.groupInfo || state.groupInfo.myRole !== 'admin' || !editGroupModal) {
    return
  }

  editGroupNameInput.value = state.groupInfo.group.name || ''
  editGroupDescriptionInput.value = state.groupInfo.group.description || ''

  showEditGroupError('')
  updateEditGroupUI()

  editGroupModal.classList.remove('hidden')
  editGroupModal.classList.add('flex')

  editGroupNameInput.focus()
}

function closeEditGroupModal() {
  if (!editGroupModal || state.savingGroupInfo) return

  editGroupModal.classList.add('hidden')
  editGroupModal.classList.remove('flex')
}

async function saveGroupInfo() {
  if (state.savingGroupInfo) return

  const name = editGroupNameInput.value.trim()

  if (name.length < 2) {
    showEditGroupError('Le nom du groupe doit contenir au moins 2 caractères.')
    return
  }

  state.savingGroupInfo = true
  showEditGroupError('')
  saveEditGroupButton.disabled = true
  saveEditGroupButton.innerHTML = '<span>Enregistrement...</span>'

  try {
    const result = await api(`/conversations/${state.selectedConversationId}/group`, {
      method: 'PATCH',
      body: JSON.stringify({
        name,
        description: editGroupDescriptionInput.value.trim(),
      }),
    })

    const updatedGroup = result.data.group

    state.groupInfo.group = { ...state.groupInfo.group, ...updatedGroup }

    renderGroupInfoHeader(
      state.groupInfo.group.name,
      state.groupInfo.group.description,
      state.groupInfo.group.avatar
    )

    state.savingGroupInfo = false
    closeEditGroupModal()

    await loadConversations(true)
  } catch (error) {
    if (error.message === 'SESSION_EXPIRED') {
      window.location.reload()
      return
    }

    showEditGroupError(
      error.message.startsWith('REQUEST_FAILED')
        ? 'Impossible de modifier le groupe. Réessaie.'
        : error.message
    )
  } finally {
    state.savingGroupInfo = false
    saveEditGroupButton.innerHTML = '<span>Enregistrer</span>'
    updateEditGroupUI()
  }
}

// Branche les écouteurs d'événements de cette fonctionnalité
export function setupGroups() {
  createGroupButton?.addEventListener('click', openCreateGroupModal)

  closeCreateGroupButton?.addEventListener('click', closeCreateGroupModal)

  cancelCreateGroupButton?.addEventListener('click', closeCreateGroupModal)

  confirmCreateGroupButton?.addEventListener('click', createGroup)

  groupNameInput?.addEventListener('input', updateCreateGroupUI)

  groupMemberSearch?.addEventListener('input', () => {
    renderGroupMembers(groupMemberSearch.value)
  })

  createGroupModal?.addEventListener('click', (event) => {
    if (event.target === createGroupModal) {
      closeCreateGroupModal()
    }
  })

  document.addEventListener('keydown', (event) => {
    if (
      event.key === 'Escape' &&
      createGroupModal &&
      !createGroupModal.classList.contains('hidden')
    ) {
      closeCreateGroupModal()
    }
  })

  $('#chatHeaderName')?.addEventListener('click', openGroupInfo)

  $('#chatHeaderAvatar')?.addEventListener('click', openGroupInfo)

  $('#chatHeaderAvatarFallback')?.addEventListener('click', openGroupInfo)

  changeGroupAvatarButton?.addEventListener('click', () => {
    groupAvatarInput?.click()
  })

  groupAvatarInput?.addEventListener('change', (event) => {
    const file = event.target.files?.[0]

    // Permet de choisir deux fois de suite le même fichier
    groupAvatarInput.value = ''

    if (file) {
      changeGroupAvatar(file)
    }
  })

  closeGroupInfoButton?.addEventListener('click', closeGroupInfo)

  groupInfoSearch?.addEventListener('input', () => {
    renderGroupInfoMembers(groupInfoSearch.value)
  })

  groupInfoModal?.addEventListener('click', (event) => {
    if (event.target === groupInfoModal) {
      closeGroupInfo()
    }
  })

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && groupInfoModal && !groupInfoModal.classList.contains('hidden')) {
      closeGroupInfo()
    }
  })

  groupInfoMenuButton?.addEventListener('click', (event) => {
    event.stopPropagation()
    groupInfoMenu?.classList.toggle('hidden')
  })

  groupInfoMenu?.addEventListener('click', (event) => {
    const target = event.target

    if (!(target instanceof Element)) {
      return
    }

    const button = target.closest('[data-group-action]')

    if (!button) {
      return
    }

    closeGroupInfoMenu()
    handleGroupAction(button.dataset.groupAction)
  })

  document.addEventListener('click', (event) => {
    if (event.target instanceof Element && !event.target.closest('#groupInfoMenuWrapper')) {
      closeGroupInfoMenu()
    }
  })

  saveEditGroupButton?.addEventListener('click', saveGroupInfo)

  cancelEditGroupButton?.addEventListener('click', closeEditGroupModal)

  closeEditGroupButton?.addEventListener('click', closeEditGroupModal)

  editGroupNameInput?.addEventListener('input', updateEditGroupUI)

  editGroupModal?.addEventListener('click', (event) => {
    if (event.target === editGroupModal) {
      closeEditGroupModal()
    }
  })

  cancelAddMembersButton?.addEventListener('click', closeAddMembers)

  confirmAddMembersButton?.addEventListener('click', confirmAddMembers)

  addMembersSearch?.addEventListener('input', () => {
    renderAddMembersList(addMembersSearch.value)
  })

  // Retirer des membres
  cancelRemoveMembersButton?.addEventListener('click', closeRemoveMembers)

  confirmRemoveMembersButton?.addEventListener('click', openRemoveMembersConfirm)

  removeMembersSearch?.addEventListener('input', () => {
    renderRemoveMembersList(removeMembersSearch.value)
  })

  // Confirmation du retrait
  cancelRemoveMembersConfirmButton?.addEventListener('click', closeRemoveMembersConfirm)

  validateRemoveMembersButton?.addEventListener('click', confirmRemoveMembers)

  // Suppression du groupe
  cancelDeleteGroupButton?.addEventListener('click', closeDeleteGroupConfirm)

  confirmDeleteGroupButton?.addEventListener('click', deleteGroup)

  deleteGroupConfirmModal?.addEventListener('click', (event) => {
    if (event.target === deleteGroupConfirmModal) {
      closeDeleteGroupConfirm()
    }
  })

  document.addEventListener('keydown', (event) => {
    if (
      event.key === 'Escape' &&
      deleteGroupConfirmModal &&
      !deleteGroupConfirmModal.classList.contains('hidden')
    ) {
      closeDeleteGroupConfirm()
    }
  })
}
