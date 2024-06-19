import { Keyboard } from 'grammy'

export const editExpenseKeyboard = new Keyboard()
  .text('Ask 🎙️')
  .row()
  .text('Just add ➕')
  .row()
  .text('Cancel ❌')
  .resized()
  .oneTime()
