import mongoose from 'mongoose'
import {keys} from './keys'

export default async () => {
  try {
    await mongoose.connect(keys.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    console.log('MongoDB connected')
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}
